//
// 
// Automatically swaps between local developer server testing ports and your Vercel URL
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5500/api/geoip'
    : '/api/geoip';

// Global variable tracker to cleanly destroy old map assets between iterative scan passes
let geoMapInstance = null;

async function executeGeoScan() {
    const targetInput = document.getElementById('geoTargetInput').value.trim();
    const logOutput = document.getElementById('geoLogOutput');
    const mapWrapper = document.getElementById('geoMapWrapper');
    const spinner = document.getElementById('geoSpinner');

    if (!targetInput) {
        alert("Please specify a target indicator IP or Domain.");
        return;
    }

    // Reset interface visibility parameters for a clean tracking pass
    spinner.classList.remove('hidden');
    logOutput.classList.add('hidden');
    mapWrapper.classList.add('hidden');

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: targetInput })
        });
        
        const data = await response.json();
        spinner.classList.add('hidden');

        if (data.success) {
            // 1. Inject the text telemetry logs
            logOutput.classList.remove('hidden');
            logOutput.innerHTML = `[+] GEOLOCATION RESOLUTION LOGS:\n\n${data.raw_log}`;
            
            // 2. Parse out coordinate parameters safely
            const lat = parseFloat(data.latitude);
            const lng = parseFloat(data.longitude);

            // Verify coordinates are numbers and not a defaulted zero array vector
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                
                // CRITICAL CORRECTION: Unhide the wrapper block BEFORE mounting Leaflet
                // This forces the browser to compile the '#liveGeoMap' container width/height dimensions.
                mapWrapper.classList.remove('hidden');

                // If a map instance already exists from a previous search, destroy it cleanly to free memory links
                if (geoMapInstance !== null) {
                    geoMapInstance.remove();
                    geoMapInstance = null;
                }

                // Initialize Leaflet mapping layout instance directed over target parameters
                geoMapInstance = L.map('liveGeoMap').setView([lat, lng], 13);

                // Apply the dark-cyber dashboard mapping tile overlay (CartoDB DarkMatter)
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://carto.com/">CARTO</a> platform mesh',
                    maxZoom: 20
                }).addTo(geoMapInstance);

                // Add standard tracker target marker node point
                const marker = L.marker([lat, lng]).addTo(geoMapInstance);
                
                // Dynamic telemetry confirmation pop-up tracking window binding
                marker.bindPopup(`
                    <div style="font-family: monospace; color: #0b0c10; font-size: 12px;">
                        <b style="color: #06b6d4;">TARGET:</b> ${targetInput}<br>
                        <b style="color: #00ffcc;">COORDS:</b> ${lat.toFixed(5)}, ${lng.toFixed(5)}
                    </div>
                `).openPopup();

                // Forces Leaflet to recalculate map box sizes instantly to stop grey tile rendering anomalies
                setTimeout(() => {
                    if (geoMapInstance) {
                        geoMapInstance.invalidateSize();
                    }
                }, 150);
            }
        } else {
            logOutput.classList.remove('hidden');
            logOutput.innerHTML = `⚠️ SCAN EXCEPTION: ${data.error}`;
        }
    } catch (err) {
        spinner.classList.add('hidden');
        console.error("[!] GeoIP execution framework trace exception:", err.message);
    }
}

// Ensure execution attachment listener hooks are initialized
document.getElementById('geoScanBtn')?.addEventListener('click', executeGeoScan);


// 
//  // Automatically swaps between local developer server testing ports and your Vercel URL
// const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
//     ? 'http://localhost:5500/api/geoip'
//     : '/api/geoip';

// async function executeGeoScan() {
//     const targetInput = document.getElementById('geoTargetInput').value.trim();
//     const logOutput = document.getElementById('geoLogOutput');
//     const mapWrapper = document.getElementById('geoMapWrapper');
//     const staticMap = document.getElementById('geoStaticMap');
//     const spinner = document.getElementById('geoSpinner');

//     if (!targetInput) {
//         alert("Please specify a target indicator IP or Domain.");
//         return;
//     }

//     // Reset interface visibility parameters
//     spinner.classList.remove('hidden');
//     logOutput.classList.add('hidden');
//     mapWrapper.classList.add('hidden');

//     try {
//         const response = await fetch(BACKEND_URL, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ target: targetInput })
//         });
        
//         const data = await response.json();
//         spinner.classList.add('hidden');

//         if (data.success) {
//             // 1. Inject the text telemetry logs
//             logOutput.classList.remove('hidden');
//             logOutput.innerHTML = `[+] GEOLOCATION RESOLUTION LOGS:\n\n${data.raw_log}`;
            
//             // 2. Map Rendering Engine Check
//             if (data.longitude !== "0" && data.latitude !== "0") {
//                 // Free, fast static rendering path requiring no API access keys
//                 staticMap.src = `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${data.longitude},${data.latitude}&z=11&l=map&pt=${data.longitude},${data.latitude},pm2blm`;
                
//                 // Keep mapping elements hidden until image content buffer resolves to stop UI shifting
//                 staticMap.onload = function() {
//                     mapWrapper.classList.remove('hidden');
//                 };
//             }
//         } else {
//             logOutput.classList.remove('hidden');
//             logOutput.innerHTML = `⚠️ SCAN EXCEPTION: ${data.error}`;
//         }
//     } catch (err) {
//         spinner.classList.add('hidden');
//         alert("Fatal error connecting to target microservice framework backend.");
//     }
// }