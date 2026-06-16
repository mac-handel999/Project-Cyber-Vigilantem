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
                { role: "system", content: "You are a cybersecurity expert. Identify potential IOCs (Indicators of Compromise) and recommended remediation steps from the provided context." },
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

module.exports = app;
