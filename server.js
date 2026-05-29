const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

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
        return res.status(400).json({ error: "URL is required" });
    }

    const targetUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`;

    const requestBody = {
        client: { clientId: "project-cyber-vigilanteem", clientVersion: "1.0.0" },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: urlToCheck }]
        }
    };

    try {
        const response = await axios.post(targetUrl, requestBody);
        res.json(response.data);
    } catch (error) {
        console.error("Google API Hook Error:", error.message);
        res.status(500).json({ error: "Failed to connect to Google validation registry" });
    }
});

// Runtime Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`[Project Cyber Vigilan-teem Engine] Environment active across local routing matrix on port ${PORT}`);
});

module.exports = app;