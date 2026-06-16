const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware Ordering
app.use(express.json());

app.use(cors({
    origin: [
        'http://localhost:5000',
        'http://localhost:6700',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:6700',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ]
}));

// Main Safe Browsing API Route
app.post('/api/check-url', async (req, res) => {
    const { urlToCheck } = req.body;
    const API_KEY = process.env.GOOGLE_SAFE_BROWSING_KEY;

    if (!urlToCheck) {
        return res.status(400).json({ error: 'URL is required' });
    }

    const targetUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`;
    const requestBody = {
        client: { clientId: 'project-cyber-vigilanteem', clientVersion: '1.0.0' },
        threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: urlToCheck }]
        }
    };

    try {
        const response = await axios.post(targetUrl, requestBody);
        res.json(response.data);
    } catch (error) {
        console.error('Google API Hook Error:', error.message);
        res.status(500).json({ error: 'Failed to connect to Google validation registry' });
    }
});



// 2. Initialize the client
// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/research', async (req, res) => {
    const { query } = req.body;

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
        const chatCompletion = await groq.chat.completions.create({
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

app.listen(5500, () => console.log('Server running on http://localhost:5500'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`[Project Cyber Vigilan-teem Engine] Environment active across local routing matrix on port ${PORT}`);
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

// --- Roadmap Route ---
app.post('/api/generate-roadmap', async (req, res) => {
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ error: "Goal is required" });
    
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
        const chatCompletion = await groq.chat.completions.create({
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

app.listen(5500, () => console.log('Server running on port 5500'));




module.exports = app;
