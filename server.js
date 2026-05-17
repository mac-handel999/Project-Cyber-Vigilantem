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