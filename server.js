const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();

// Keys live in the Vercel project environment. Locally they come from .env,
// which is gitignored; see .env.example for the full list.
const REQUIRED_KEYS = {
    GOOGLE_SAFE_BROWSING_KEY: '/api/check-url',
    SERP_API_KEY: '/api/research, /api/generate-roadmap',
    GROQ_API_KEY: '/api/research, /api/generate-roadmap',
    LEAKCHECK_API_KEY: '/api/breach-check',
    IPINFO_API_KEY: '/api/ip-telemetry'
};

function missingKeys() {
    return Object.entries(REQUIRED_KEYS)
        .filter(([name]) => !process.env[name])
        .map(([name, routes]) => `${name} (needed by ${routes})`);
}

// Construct the Groq client lazily. Constructing it at import time throws when
// GROQ_API_KEY is absent, which killed the process before the port could bind
// and made `npm run dev` unusable on a fresh clone.
let groq = null;
function getGroq() {
    if (!groq) {
        if (!process.env.GROQ_API_KEY) {
            const err = new Error('GROQ_API_KEY is not configured locally.');
            err.statusCode = 503;
            throw err;
        }
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groq;
}

// Middleware Ordering
app.use(express.json());
// --- FIX 1: CORS POLICY EXPANSION ---
// Allows standard local development port loops while safely accepting extension traffic signatures
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve the frontend from the same origin so /manifest.json and
// /service-worker.js resolve. The service worker's scope is the whole origin,
// which requires it to be reachable at the root path.
app.use(express.static(require('path').join(__dirname, 'public')));

// Main Safe Browsing API Route
app.post('/api/check-url', async (req, res) => {
    // --- FIX 2: PAYLOAD EXTRACTION ALIGNMENT ---
    // Destructures both options so it handles standard web forms or extension JSON objects flawlessly
    const { urlToCheck, target } = req.body;
    const finalUrl = urlToCheck || target; 

    const API_KEY = process.env.GOOGLE_SAFE_BROWSING_KEY;

    if (!finalUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Fail clearly when the key is absent locally. Without this the upstream
    // call still fires with key=undefined and surfaces as an opaque 500.
    if (!API_KEY) {
        return res.status(503).json({
            error: 'GOOGLE_SAFE_BROWSING_KEY is not configured.',
            hint: 'Add it to .env (see .env.example), or pull the Vercel values with: npx vercel env pull .env'
        });
    }

    const targetUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`;
    const requestBody = {
        client: { clientId: 'project-cyber-vigilanteem', clientVersion: '1.0.0' },
        threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: finalUrl }]
        }
    };

    try {
        const response = await axios.post(targetUrl, requestBody);
        
        // Google Safe Browsing returns an empty object {} if the site is perfectly safe.
        // Let's format the payload response data to make it easier for our popup script to read.
        if (response.data && response.data.matches) {
            res.json({
                success: true,
                isMalicious: true,
                statusText: 'Malicious Signature Detected',
                matches: response.data.matches
            });
        } else {
            res.json({
                success: true,
                isMalicious: false,
                statusText: 'Secure Link'
            });
        }
    } catch (error) {
        console.error('Google API Hook Error:', error.message);
        res.status(500).json({ error: 'Failed to connect to Google validation registry' });
    }
});

// 2. AI-assisted research endpoint

app.post('/api/research', async (req, res) => {
    const { query } = req.body;

    if (!query) return res.status(400).json({ error: 'A research query is required.' });

    const absent = requireKeys('SERP_API_KEY', 'GROQ_API_KEY');
    if (absent) return res.status(503).json({ error: `Missing credentials: ${absent}` });

    try {
        // Fetch data from SerpApi (keep this part as is)
        const searchResponse = await axios.get(`https://serpapi.com/search`, {
            params: {
                engine: "google",
                q: query + " cybersecurity advisory",
                api_key: process.env.SERP_API_KEY
            }
        });

        const context = searchResponse.data.organic_results.slice(0, 3).map(r => r.snippet).join('\n');

        // 3. Use Groq to synthesize the report
        const chatCompletion = await getGroq().chat.completions.create({
            messages: [
                { role: "system", content: "You are a cybersecurity expert. Identify potential IOCs (Indicators of Compromise), TTPs (Tatics,Techiques, and Procedures) and recommended remediation steps from the provided context." },
                { role: "user", content: `Analyze this threat intelligence: ${context}` }
            ],
            model: "llama-3.3-70b-versatile", // This is one of Groq's best models
        });

        res.json({ report: chatCompletion.choices[0].message.content });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch research data." });
    }
});

// --- Rate Limiting Logic ---
const cache = new Map();
let dailyCount = 0;
let lastResetDate = new Date().getDate();

app.use((req, res, next) => {
    const today = new Date().getDate();
    if (today !== lastResetDate) {
        dailyCount = 0;
        lastResetDate = today;
    }

    // Set limit to 8 to stay safe within your 250/mo limit
    if (req.path === '/api/generate-roadmap' && dailyCount >= 8) {
        return res.status(429).json({ error: "Daily limit reached. Please try again tomorrow." });
    }
    
    if (req.path === '/api/generate-roadmap') dailyCount++;
    next();
});

/**
 * Guard for routes that need provider credentials. Returns 503 with a clear
 * message instead of letting the request reach the upstream API with an
 * undefined key, which produced an indistinguishable 500.
 */
function requireKeys(...names) {
    const absent = names.filter((n) => !process.env[n]);
    if (!absent.length) return null;
    return absent.map((n) => `${n} (see .env.example, or: npx vercel env pull .env)`).join(', ');
}

// --- Roadmap Route ---
app.post('/api/generate-roadmap', async (req, res) => {
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ error: "Goal is required" });

    const absent = requireKeys('SERP_API_KEY', 'GROQ_API_KEY');
    if (absent) return res.status(503).json({ error: `Missing credentials: ${absent}` });

    const cacheKey = goal.toLowerCase().trim();

    // 1. Check cache
    if (cache.has(cacheKey)) {
        console.log("Serving from cache.");
        return res.json(cache.get(cacheKey));
    }

    try {
        // 2. Perform API calls
        const [ytRes, webRes] = await Promise.all([
            axios.get(`https://serpapi.com/search`, { params: { engine: "youtube", search_query: `${goal} cybersecurity roadmap`, api_key: process.env.SERP_API_KEY } }),
            axios.get(`https://serpapi.com/search`, { params: { engine: "google", q: `cybersecurity roadmap ${goal} course`, api_key: process.env.SERP_API_KEY } })
        ]);

        const resourcesContext = {
            videos: ytRes.data.video_results ? ytRes.data.video_results.slice(0, 5) : [],
            web: webRes.data.organic_results ? webRes.data.organic_results.slice(0, 5) : []
        };

        // 3. AI Generation
        const chatCompletion = await getGroq().chat.completions.create({
            messages: [
                { role: "system", content: "You are a Senior Cybersecurity Mentor. Output ONLY a valid JSON object. Format: { weeks: [{ week: number, topic: string, videos: [{title: string, link: string}], web: [{title: string, link: string}] }] }. Provide 3+ high-quality links per category." },
                { role: "user", content: `Create an 26-week roadmap for ${goal} using these resources: ${JSON.stringify(resourcesContext)}` }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const roadmapData = JSON.parse(chatCompletion.choices[0].message.content);

        // 4. Save to cache and return
        cache.set(cacheKey, roadmapData);
        res.json(roadmapData);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate roadmap." });
    }
});

//for the geo ip scanner and email breach scanner features server logic

// =================================================================
// 🛡️ SUB-ROUTINE 1: GEOLOCATION ROUTER ENGINE (HackerTarget API)
// =================================================================
app.post('/api/geoip', async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ success: false, error: "Missing parameter target string." });

    try {
        const response = await axios.get(`https://api.hackertarget.com/geoip/?q=${encodeURIComponent(target)}`);
        const rawReport = response.data;

        if (rawReport.includes("error") || rawReport.includes("No records found")) {
            return res.status(400).json({ success: false, error: "Target data parsing unresolved." });
        }

        let latitude = "0";
        let longitude = "0";
        const lines = rawReport.split('\n');
        
        lines.forEach(line => {
            if (line.toLowerCase().includes("latitude:")) latitude = line.split(':')[1].trim();
            if (line.toLowerCase().includes("longitude:")) longitude = line.split(':')[1].trim();
        });

        res.json({ success: true, latitude, longitude, raw_log: rawReport });
    } catch (error) {
        res.status(500).json({ success: false, error: "Network infrastructure timeout." });
    }
});

// =================================================================
// 🛡️ SUB-ROUTINE 2: CREDENTIAL BREACH ENGINE (LeakCheck API)
// =================================================================
app.post('/api/breach-check', async (req, res) => {
    const { identity } = req.body;
    const LEAKCHECK_KEY = process.env.LEAKCHECK_API_KEY;

    if (!identity) return res.status(400).json({ error: "Missing target verification parameter." });

    const absent = requireKeys('LEAKCHECK_API_KEY');
    if (absent) return res.status(503).json({ error: `Missing credentials: ${absent}` });

    try {
        // Querying LeakCheck engine using your custom developer API token string
        const url = `https://leakcheck.io/api/v2/query/${encodeURIComponent(identity)}?key=${LEAKCHECK_KEY}`;
        const response = await axios.get(url);

        if (response.data.success && response.data.sources && response.data.sources.length > 0) {
            const compiledSources = response.data.sources.map(source => source.name);
            res.json({ breached: true, sources: compiledSources });
        } else {
            res.json({ breached: false, sources: [] });
        }
    } catch (error) {
        console.error("LeakCheck API Connection Failure:", error.message);
        res.status(500).json({ error: "External registry response fault." });
    }
});

//for what web server logic

app.post('/api/analyze-web', async (req, res) => {
    const { targetUrl } = req.body;

    if (!targetUrl) return res.status(400).json({ error: "A target URL is required." });

    // Extract a clean domain string
    let domain = targetUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];

    try {
        // Query Microlink's public data mesh pass
        const response = await axios.get(`https://api.duckduckgo.com/?q=https://${domain}&format=json&pretty=1`);
        const meta = response.data.data;

        return res.json({
            status: "[200] Target Intercepted",
            httpServer: meta.headers['server'] || 'Cloudflare / Protected Network Edge',
            htmlVersion: 'HTML5 Compliance Engine',
            title: `Title[${meta.title || domain}]`,
            framework: meta.generator?.includes('Next.js') ? 'Next.js Stack' : 'React / Vanilla JS Mix Core',
            generator: meta.generator || 'No Monolithic CMS Signature',
            author: meta.author ? `Meta-Author[${meta.author}]` : 'Undetected Metadata Author',
            hsts: meta.headers['strict-transport-security'] || 'Active TLS Protection Pipeline',
            uncommonHeaders: `X-Powered-By[${meta.headers['x-powered-by'] || 'Edge Server Bundle'}]`
        });
    } catch (err) {
        return res.json({ status: "Scan Constraint Encountered", title: "Target Blocked" });
    }
});


//for what is my ip server logic

// Trusted proxy parsing matters on Vercel/Cloudflare, where req.socket
// reports the load balancer rather than the client.
app.set('trust proxy', true);

app.get('/api/ip-telemetry', async (req, res) => {
    const token = process.env.IPINFO_API_KEY;
    if (!token) {
        return res.status(503).json({
            error: 'IPINFO_API_KEY is not configured.',
            hint: 'Add it to .env (see .env.example), or pull the Vercel values with: npx vercel env pull .env'
        });
    }

    // Real client IP from the proxy chain; the socket address is only a fallback.
    let clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '';
    if (clientIp.includes(',')) clientIp = clientIp.split(',')[0].trim();
    clientIp = (clientIp || req.socket.remoteAddress || '').replace(/^::ffff:/, '');

    // Loopback has no geodata, so local development reads a fixed public node
    // instead of returning an empty result.
    if (clientIp === '::1' || clientIp === '127.0.0.1' || !clientIp) {
        clientIp = '8.8.8.8';
    }

    try {
        // Server-side call: the token never reaches the browser.
        const response = await axios.get(`https://ipinfo.io/${clientIp}/json`, {
            params: { token },
            timeout: 6000
        });
        res.json(response.data);
    } catch (err) {
        console.error(`[!] ipinfo lookup failed for ${clientIp}: ${err.message}`);
        res.status(502).json({ error: 'Could not reach the IP telemetry provider.' });
    }
});



const tls = require('node:tls'); // Native cryptographic socket engine
// const axios = require('axios');

// Unified WHOIS + SSL Recon Architecture Node
app.post('/api/whois', async (req, res) => {
    const { domain } = req.body;

    if (!domain) {
        return res.status(400).json({ error: "Missing target host criteria." });
    }

    // Clean up input string vectors
    const rawTarget = domain.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];

    // Regex check to accurately identify IPv4 / IPv6 syntax parameters
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/;
    const isIpAddress = ipRegex.test(rawTarget);

    try {
        let rdapUrl = `https://rdap.org/domain/${rawTarget}`;
        let sslData = { status: "NOT APPLICABLE (IP Node)", issuer: "N/A", expires: "N/A", daysRemaining: "N/A" };

        if (isIpAddress) {
            // Re-route RDAP endpoint block tracking matrix if target is an IP address
            rdapUrl = `https://rdap.org/ip/${rawTarget}`;
        }

        console.log(`[+] Running dual vector scan [IP: ${isIpAddress}] against host: ${rawTarget}`);

        // 1. Fetch Registry Records via RDAP Mesh Proxy
        const rdapResponse = await axios.get(rdapUrl, { timeout: 6000 });
        const d = rdapResponse.data;

        // 2. Execute Local TLS Socket Handshake if the target is a Domain
        if (!isIpAddress) {
            sslData = await checkSslCertificate(rawTarget);
        }

        // Parse Entity Registrars or Network Assignment Providers out of the layout schema
        const registrarEntity = d.entities?.find(e => e.roles?.includes('registrar') || e.roles?.includes('registrant'));
        const providerName = registrarEntity?.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3] || "Undisclosed Registry Group";

        const createdEvent = d.events?.find(e => e.eventAction === 'registration');
        const expiryEvent = d.events?.find(e => e.eventAction === 'expiration');

        return res.json({
            success: true,
            isIp: isIpAddress,
            target: rawTarget.toUpperCase(),
            provider: providerName,
            created: createdEvent ? new Date(createdEvent.eventDate).toDateString() : "Unavailable / Hidden",
            expires: expiryEvent ? new Date(expiryEvent.eventDate).toDateString() : "Unavailable / Open Alloc",
            status: d.status ? d.status.join(' | ').toUpperCase() : "ACTIVE ASSIGNMENT",
            ssl: sslData,
            raw_log: JSON.stringify(d, null, 2)
        });

    } catch (err) {
        console.error(`[!] Recon operational drop: ${err.message}`);
        return res.json({
            success: false,
            error: "Host record signature unreachable or structurally unmapped at root levels."
        });
    }
});

// Helper Function: Native cryptographic certificate resolution wrapper
function checkSslCertificate(hostname) {
    return new Promise((resolve) => {
        const options = {
            servername: hostname, // SNI handshake support context enforcement
            rejectUnauthorized: false, // Prevents self-signed edge cases from crashing the script pipe
            minVersion: 'TLSv1.2'
        };

        const socket = tls.connect(443, hostname, options, () => {
            const cert = socket.getPeerCertificate(); // Capture binary X509 parameters safely
            
            if (!cert || Object.keys(cert).length === 0) {
                resolve({ status: "UNAVAILABLE / NO PORT 443 LISTENER", issuer: "Unknown", expires: "N/A", daysRemaining: "N/A" });
                socket.destroy();
                return;
            }

            const expiryDate = new Date(cert.valid_to); //
            const today = new Date();
            const timeDiff = expiryDate - today;
            const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            resolve({
                status: daysRemaining > 0 ? "VALID SECURE LAYER" : "EXPIRED WARNING",
                issuer: cert.issuer.CN || cert.issuer.O || "Unknown Authority",
                expires: expiryDate.toDateString(),
                daysRemaining: daysRemaining
            });
            socket.destroy();
        });

        socket.on('error', (err) => {
            resolve({ status: `HANDSHAKE FAILED (${err.code || 'TIMEOUT'})`, issuer: "None", expires: "N/A", daysRemaining: "N/A" });
            socket.destroy();
        });

        // Set short timeout bounds to prevent hanging background micro-threads
        socket.setTimeout(4000, () => {
            resolve({ status: "CONNECTION TIMEOUT", issuer: "N/A", expires: "N/A", daysRemaining: "N/A" });
            socket.destroy();
        });
    });
}


module.exports = app;

// Start the HTTP listener exactly once, after every route is registered.
// `module.exports` above still lets the app be imported by tests or tooling
// without binding a port.
if (require.main === module) {
    const basePort = Number(process.env.PORT) || 5500;
    let activePort = basePort;
    let server = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    // VS Code's Live Server extension auto-starts on 5500, so the default port
    // is frequently taken. Rather than fail, walk to the next free port and
    // print it, otherwise the browser silently lands on the wrong server and
    // every asset 404s.
    function listen() {
        server = app.listen(activePort);

        server.on('listening', () => {
            const note = activePort === basePort
                ? ''
                : `\n[note] Port ${basePort} was busy (commonly a VS Code Live Server), so this app is on ${activePort}.`;
            console.log(`[Project Cyber Vigilan-Teem] Server active on http://localhost:${activePort}${note}`);

            // List every absent key at once. On Vercel these are configured, so
            // this only fires locally and saves hunting for them one 503 at a time.
            const absent = missingKeys();
            if (absent.length) {
                console.warn(
                    `\n[warn] ${absent.length} credential(s) not set in this environment:\n` +
                    absent.map((k) => `         - ${k}`).join('\n') +
                    `\n       To load the values already set on Vercel:  npx vercel env pull .env\n` +
                    `       Or copy .env.example to .env and fill them in.\n`
                );
            }
        });

        server.on('error', (err) => {
            if (err.code !== 'EADDRINUSE') {
                console.error('[error] Server failed to start:', err.message);
                process.exit(1);
            }

            attempts++;
            if (attempts >= MAX_ATTEMPTS) {
                console.error(
                    `\n[error] Could not find a free port. Tried ${basePort}-${activePort}.\n` +
                    `        Close whatever is holding them, or set PORT explicitly.\n`
                );
                process.exit(1);
            }

            activePort++;
            listen();
        });
    }

    listen();
}
