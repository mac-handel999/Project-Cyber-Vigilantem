  require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allows your frontend to talk to this server

app.post('/api/check-url', async (req, res) => {
    const { urlToCheck } = req.body;
    const API_KEY = process.env.GOOGLE_SAFE_BROWSING_KEY;
    const GOOGLE_URL = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`;

    try {
        const response = await axios.post(GOOGLE_URL, {
            client: { clientId: "my-app", clientVersion: "1.0.0" },
            threatInfo: {
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: [{ url: urlToCheck }]
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch from Google" });
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));



//for testing purposes only, you can run this server with `node server.js` and it will listen on port 5000. Make sure to replace the API key in your .env file with your actual Google Safe Browsing API key.

//for testing, you can use a known malicious URL like "http://malware.testing.google.test/testing/malware/" to see if the API correctly identifies it as unsafe.

//for pentester.com and HIBP, you would create similar endpoints that use their respective API keys and endpoints to check for breaches or vulnerabilities related to the URL or domain.

// Add this inside your existing server.js file

app.post('/api/scan-domain', async (req, res) => {
    const { domainToScan } = req.body;
    const PENTESTER_KEY = process.env.PENTESTER_API_KEY;

    if (!domainToScan) {
        return res.status(400).json({ error: "Domain name is required" });
    }

    try {
        // Calling Pentester.com's automated scan api
        const response = await axios.post('https://api.pentester.com/v1/scans', {
            target: domainToScan
        }, {
            headers: {
                'Authorization': `Bearer ${PENTESTER_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Send the vulnerability summary data back to your frontend
        res.json({ success: true, scanData: response.data });

    } catch (error) {
        console.error("Pentester.com API Error:", error.message);
        res.status(500).json({ error: "Failed to initiate vulnerability scan" });
    }
});


//for vercel deployment, make sure to set the environment variables (GOOGLE_SAFE_BROWSING_KEY and PENTESTER_API

// ... Your existing express routes, axios setup, and middleware ...

// Keep your local listening port block for testing, but add the export line:
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Local server running on port ${PORT}`));
}

// CRUCIAL FOR VERCEL: Export the app module
module.exports = app;