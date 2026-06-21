

let mapInstance = null;

async function runNetworkReconnaissance() {
    const elements = {
        scanState: document.getElementById('scanState'),
        ipv4: document.getElementById('valIpv4'),
        ipv6: document.getElementById('valIpv6'),
        as: document.getElementById('valAs'),
        asName: document.getElementById('valAsName'),
        isp: document.getElementById('valIsp'),
        status: document.getElementById('valStatus'),
        proxy: document.getElementById('valProxy'),
        mobile: document.getElementById('valMobile'),
        hosting: document.getElementById('valHosting'),
        services: document.getElementById('valServices'),
        continent: document.getElementById('valContinent'),
        continentCode: document.getElementById('valContinentCode'),
        country: document.getElementById('valCountry'),
        countryCode: document.getElementById('valCountryCode'),
        region: document.getElementById('valRegion'),
        city: document.getElementById('valCity'),
        zip: document.getElementById('valZip'),
        coords: document.getElementById('valCoords'),
        timezone: document.getElementById('valTimezone'),
        currency: document.getElementById('valCurrency')
    };

    if (elements.scanState) {
        elements.scanState.innerText = "Syncing Node...";
        elements.scanState.style.borderColor = "#ffaa00";
        elements.scanState.style.color = "#ffaa00";
    }

    try {
        // Query your clean backend endpoint route (Works on local dev & production)
        const response = await fetch('http://localhost:5500/api/ip-telemetry' || '/api/ip-telemetry' );
        if (!response.ok) throw new Error("Backend infrastructure rejected request context.");
        const data = await response.json();

        // Map telemetry data fields safely into place
        if (elements.ipv4) elements.ipv4.innerText = data.ip;
        if (elements.ipv6) elements.ipv6.innerText = "Optimized / Tunnel Enforced";
        if (elements.as) elements.as.innerText = data.asNumber;
        if (elements.asName) elements.asName.innerText = data.asName;
        if (elements.isp) elements.isp.innerText = data.isp;
        if (elements.status) elements.status.innerText = data.status;
        if (elements.proxy) elements.proxy.innerText = data.proxy;
        if (elements.mobile) elements.mobile.innerText = data.mobile;
        if (elements.hosting) elements.hosting.innerText = data.hosting;
        if (elements.services) elements.services.innerText = data.services;
        
        if (elements.continent) elements.continent.innerText = data.continent;
        if (elements.continentCode) elements.continentCode.innerText = data.continentCode;
        if (elements.country) elements.country.innerText = data.country;
        if (elements.countryCode) elements.countryCode.innerText = data.country;
        if (elements.region) elements.region.innerText = data.region; //
        if (elements.city) elements.city.innerText = data.city; //
        if (elements.zip) elements.zip.innerText = data.zip;
        if (elements.coords) elements.coords.innerText = `Lat/Long: ${data.loc}`; //
        if (elements.timezone) elements.timezone.innerText = data.timezone;
        if (elements.currency) elements.currency.innerText = data.currency;

        if (elements.scanState) {
            elements.scanState.innerText = "SECURE SYNC";
            elements.scanState.style.borderColor = "var(--neon-mint)";
            elements.scanState.style.color = "var(--neon-mint)";
        }

        // --- INTERACTIVE MAP RENDERING ---
        if (data.loc && data.loc !== "0,0") {
            const [latitude, longitude] = data.loc.split(',').map(coord => parseFloat(coord)); //

            if (mapInstance !== null) {
                mapInstance.remove(); // Reset map canvas instance on refreshes
            }

            mapInstance = L.map('reconMap').setView([latitude, longitude], 12); //

            // Inject a clean dark-mode cyber mapping layer grid
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://carto.com/">CARTO</a> data grid'
            }).addTo(mapInstance);

            const targetMarker = L.marker([latitude, longitude]).addTo(mapInstance); //
            targetMarker.bindPopup(`<b style="color: #06b6d4;">Node IP:</b> ${data.ip}<br><b style="color: #00ffcc;">Loc:</b> ${data.city}, ${data.region}`).openPopup();
        }

    } catch (err) {
        console.error("[!] Frontend interface sync exception:", err.message);
        if (elements.scanState) {
            elements.scanState.innerText = "SIGNAL RESTRICTED";
            elements.scanState.style.borderColor = "#ff3366";
            elements.scanState.style.color = "#ff3366";
        }
    }
}

window.addEventListener('DOMContentLoaded', runNetworkReconnaissance);
const refreshBtn = document.getElementById('refreshBtn') || document.getElementById('reAuthBtn');
if (refreshBtn) refreshBtn.addEventListener('click', runNetworkReconnaissance);




















// // Initialize a global map variable to cleanly manage layout reinstantiations on refresh cycles
// let mapInstance = null;

// async function runNetworkReconnaissance() {
//     const elements = {
//         scanState: document.getElementById('scanState'),
//         ipv4: document.getElementById('valIpv4'),
//         ipv6: document.getElementById('valIpv6'),
//         as: document.getElementById('valAs'),
//         asName: document.getElementById('valAsName'),
//         isp: document.getElementById('valIsp'),
//         status: document.getElementById('valStatus'),
//         proxy: document.getElementById('valProxy'),
//         mobile: document.getElementById('valMobile'),
//         hosting: document.getElementById('valHosting'),
//         services: document.getElementById('valServices'),
//         continent: document.getElementById('valContinent'),
//         continentCode: document.getElementById('valContinentCode'),
//         country: document.getElementById('valCountry'),
//         countryCode: document.getElementById('valCountryCode'),
//         region: document.getElementById('valRegion'),
//         city: document.getElementById('valCity'),
//         zip: document.getElementById('valZip'),
//         coords: document.getElementById('valCoords'),
//         timezone: document.getElementById('valTimezone'),
//         currency: document.getElementById('valCurrency')
//     };

//     // Replace this string with the actual API Key token from your ipinfo.io dashboard account
//     const IPINFO_TOKEN = "f0cb2af40db99f";

//     if (elements.scanState) {
//         elements.scanState.innerText = "Syncing Node...";
//         elements.scanState.style.borderColor = "#ffaa00";
//         elements.scanState.style.color = "#ffaa00";
//     }

//     try {
//         // Fetch authenticated telemetry profile from IPinfo with token routing validation
//         const response = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`);
//         if (!response.ok) throw new Error("Authenticated node token handshake rejected.");
//         const data = await response.json();

//         // Parse out ASN structures cleanly (e.g., split "AS12345 Globacom Limited")
//         let asnNumber = "Unavailable";
//         let asnCompany = "Unknown AS Entity Pool";
//         if (data.org) {
//             const orgParts = data.org.split(' ');
//             asnNumber = orgParts[0]; 
//             asnCompany = orgParts.slice(1).join(' '); 
//         }

//         // Map responses out of your token payload straight to UI fields
//         if (elements.ipv4) elements.ipv4.innerText = data.ip || "Undetected";
//         if (elements.ipv6) elements.ipv6.innerText = "Optimized / Tunnel Enforced";
        
//         if (elements.as) elements.as.innerText = asnNumber;
//         if (elements.asName) elements.asName.innerText = asnCompany;
//         if (elements.isp) elements.isp.innerText = asnCompany; 
//         if (elements.status) elements.status.innerText = "SUCCESS (Token Authenticated Mesh)";

//         // Infrastructure and Security Analysis
//         const lowerOrg = (data.org || '').toLowerCase();
//         const isCloudOrHosting = lowerOrg.includes('amazon') || lowerOrg.includes('google') || lowerOrg.includes('microsoft') || lowerOrg.includes('hosting') || lowerOrg.includes('digitalocean');
        
//         if (elements.proxy) elements.proxy.innerText = "Clear Connection Path"; 
//         if (elements.mobile) elements.mobile.innerText = isCloudOrHosting ? "Fixed Line Node" : "Mobile / Cellular Broadband Link";
//         if (elements.hosting) elements.hosting.innerText = isCloudOrHosting ? "Data Center / Hosting Infra" : "Residential Deployment Asset";
        
//         if (elements.services) {
//             elements.services.innerText = isCloudOrHosting ? "Cloud Hosting Routing Center" : "Standard Broadband Network Node";
//         }

//         // Geographic Matrix Alignment Configuration
//         if (elements.continent) elements.continent.innerText = "Africa"; // Structural context default alignment
//         if (elements.continentCode) elements.continentCode.innerText = "AF";
//         if (elements.country) elements.country.innerText = data.country || "Unavailable";
//         if (elements.countryCode) elements.countryCode.innerText = data.country || "Unavailable";
//         if (elements.region) elements.region.innerText = data.region || "Unavailable";
//         if (elements.city) elements.city.innerText = data.city || "Unavailable";
//         if (elements.zip) elements.zip.innerText = data.postal || "Not applicable";
//         if (elements.coords) elements.coords.innerText = data.loc ? `Lat/Long: ${data.loc}` : "Unavailable";
        
//         if (elements.timezone) elements.timezone.innerText = data.timezone || "Unavailable";
//         if (elements.currency) elements.currency.innerText = "Local Unit Account"; 

//         // Update main status badge to verified state
//         if (elements.scanState) {
//             elements.scanState.innerText = "SECURE SYNC";
//             elements.scanState.style.borderColor = "var(--neon-mint)";
//             elements.scanState.style.color = "var(--neon-mint)";
//         }

//         // --- MAP RENDERING ENGINE LOOP ---
//         if (data.loc) {
//             // Split out "latitude,longitude" coordinates safely
//             const [latitude, longitude] = data.loc.split(',').map(coord => parseFloat(coord));

//             // Safely tear down old maps if users hit the 'Refresh' link to prevent dual rendering engine locks
//             if (mapInstance !== null) {
//                 mapInstance.remove();
//             }

//             // Create Leaflet target window view centered directly over target node coordinates
//             mapInstance = L.map('reconMap').setView([latitude, longitude], 12);

//             // Inject a dark cyber-grid tile map layout skin (CartoDB DarkMatter theme)
//             L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
//                 attribution: '&copy; <a href="https://carto.com/">CARTO</a> data mesh',
//                 maxZoom: 20
//             }).addTo(mapInstance);

//             // Drop a clean, tracking node marker directly over the location coordinate point
//             const targetMarker = L.marker([latitude, longitude]).addTo(mapInstance);
//             targetMarker.bindPopup(`<b style="color: #06b6d4;">Node IP:</b> ${data.ip}<br><b style="color: #00ffcc;">Loc:</b> ${data.city}, ${data.region}`).openPopup();
//         }

//     } catch (err) {
//         console.error("[!] Authenticated reconnaissance transit failure:", err.message);
//         if (elements.scanState) {
//             elements.scanState.innerText = "TOKEN ERROR";
//             elements.scanState.style.borderColor = "#ff3366";
//             elements.scanState.style.color = "#ff3366";
//         }
        
//         Object.keys(elements).forEach(key => {
//             if (key !== 'scanState' && elements[key]) {
//                 elements[key].innerText = "Signal Restricted";
//             }
//         });
//     }
// }

// // Attach listeners to initialize the application pipeline
// window.addEventListener('DOMContentLoaded', runNetworkReconnaissance);

// const refreshBtn = document.getElementById('refreshBtn') || document.getElementById('reAuthBtn');
// if (refreshBtn) {
//     refreshBtn.addEventListener('click', runNetworkReconnaissance);
// }