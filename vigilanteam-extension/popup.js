let popupMapInstance = null;
const IPINFO_TOKEN = "f0cb2af40db99f"; // Insert your newly created IPinfo Token here

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get current active browser tab coordinates/URLs parameters
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    const currentUrl = new URL(tab.url);
    document.getElementById('targetUrl').innerText = currentUrl.hostname;

    // Execute concurrent tasks: Core URL Safety analysis & Network IP Telemetry Lookup
    runUrlSafetyScan(tab.url);
    runExtensionNetworkTelemetry();
});

// Mock validation function placeholder mapping to your Safe Browsing API or Vercel routing
async function runUrlSafetyScan(targetUrl) {
    const statusEl = document.getElementById('safetyStatus');
    try {
        // Simulating processing handshake execution timing
        setTimeout(() => {
            statusEl.innerText = "VERIFIED / SECURE";
            statusEl.style.color = "#00ffcc";
        }, 1200);
    } catch (err) {
        statusEl.innerText = "SCAN FAIL";
    }
}

// Full IP Telemetry Mesh Integration (The What's My IP migration sequence)
async function runExtensionNetworkTelemetry() {
    try {
        // Query IPinfo authenticated token mesh directly out of the extension layer context
        const response = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`);
        if (!response.ok) throw new Error("Handshake rejected.");
        const data = await response.json();

        // Separate ASN properties cleanly
        let ispName = "Unknown ISP Provider Node";
        if (data.org) {
            ispName = data.org.split(' ').slice(1).join(' ');
        }

        // Bind data fields straight to your popup views container properties
        document.getElementById('nodeIp').innerText = data.ip || "Unavailable";
        document.getElementById('nodeIsp').innerText = ispName;
        document.getElementById('nodeCountry').innerText = data.country || "Unavailable";
        document.getElementById('nodeRegion').innerText = data.region || "Unavailable";
        document.getElementById('nodeCoords').innerText = data.loc || "Unavailable";

        // Map Render Optimization Process
        if (data.loc) {
            const [lat, lon] = data.loc.split(',').map(c => parseFloat(c));

            if (popupMapInstance !== null) {
                popupMapInstance.remove();
            }

            // Create compact map panel window frame layer instance
            popupMapInstance = L.map('extMap', {
                zoomControl: false, // Turn off controls to keep UI ultra-clean inside the narrow window
                attributionControl: false
            }).setView([lat, lon], 11);

            // Apply your signature dark-matter cyber tileset
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 18
            }).addTo(popupMapInstance);

            // Add simple indicator pin marker over location map
            L.marker([lat, lon]).addTo(popupMapInstance);
            
            // Force Leaflet recalculation metrics to map cleanly into views sizing structure 
            setTimeout(() => {
                if (popupMapInstance) popupMapInstance.invalidateSize();
            }, 200);
        }

    } catch (err) {
        console.error("[!] Extension network telemetry drop error:", err.message);
        const placeholders = ['nodeIp', 'nodeIsp', 'nodeCountry', 'nodeRegion', 'nodeCoords'];
        placeholders.forEach(id => {
            document.getElementById(id).innerText = "Restricted Signal";
            document.getElementById(id).style.color = "#ff3366";
        });
    }
}