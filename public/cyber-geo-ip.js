// Automatically swaps between local developer server testing ports and your Vercel URL
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5500/api/geoip'
    : '/api/geoip';

async function executeGeoScan() {
    const targetInput = document.getElementById('geoTargetInput').value.trim();
    const logOutput = document.getElementById('geoLogOutput');
    const mapWrapper = document.getElementById('geoMapWrapper');
    const staticMap = document.getElementById('geoStaticMap');
    const spinner = document.getElementById('geoSpinner');

    if (!targetInput) {
        alert("Please specify a target indicator IP or Domain.");
        return;
    }

    // Reset interface visibility parameters
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
            
            // 2. Map Rendering Engine Check
            if (data.longitude !== "0" && data.latitude !== "0") {
                // Free, fast static rendering path requiring no API access keys
                staticMap.src = `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${data.longitude},${data.latitude}&z=11&l=map&pt=${data.longitude},${data.latitude},pm2blm`;
                
                // Keep mapping elements hidden until image content buffer resolves to stop UI shifting
                staticMap.onload = function() {
                    mapWrapper.classList.remove('hidden');
                };
            }
        } else {
            logOutput.classList.remove('hidden');
            logOutput.innerHTML = `⚠️ SCAN EXCEPTION: ${data.error}`;
        }
    } catch (err) {
        spinner.classList.add('hidden');
        alert("Fatal error connecting to target microservice framework backend.");
    }
}