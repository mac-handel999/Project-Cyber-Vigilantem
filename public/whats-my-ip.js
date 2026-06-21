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

    // Trigger visual loading sequence state
    elements.scanState.innerText = "Syncing Node...";
    elements.scanState.style.borderColor = "#ffaa00";
    elements.scanState.style.color = "#ffaa00";

    // Set this string to your live endpoint or a relative URI path depending on repository binding
    // E.g., '/api/ip-telemetry' if hosted in a monolithic app layout, or your full live Vercel backend URL
    const PROD_BACKEND_ENDPOINT = 'http://localhost:5500/api/ip-telemetry';

    try {
        const response = await fetch(PROD_BACKEND_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error("Production routing gateway rejected handshake.");
        const data = await response.json();

        // Bind data parameters straight out of backend proxy mapping values
        elements.ipv4.innerText = data.ipv4;
        elements.ipv6.innerText = data.ipv6;
        elements.as.innerText = data.asNumber;
        elements.asName.innerText = data.asName;
        elements.isp.innerText = data.isp;
        elements.status.innerText = data.status;
        elements.proxy.innerText = data.proxy;
        elements.mobile.innerText = data.mobile;
        elements.hosting.innerText = data.hosting;
        elements.services.innerText = data.services;
        elements.continent.innerText = data.continent;
        elements.continentCode.innerText = data.continentCode;
        elements.country.innerText = data.country;
        elements.countryCode.innerText = data.countryCode;
        elements.region.innerText = data.region;
        elements.city.innerText = data.city;
        elements.zip.innerText = data.zip;
        elements.coords.innerText = data.coords;
        elements.timezone.innerText = data.timezone;
        elements.currency.innerText = data.currency;

        // Set secure authentication layout indicator flags
        elements.scanState.innerText = "Secure Sync";
        elements.scanState.style.borderColor = "var(--neon-mint)";
        elements.scanState.style.color = "var(--neon-mint)";

    } catch (err) {
        console.error("[!] Production interface rendering fault:", err.message);
        elements.scanState.innerText = "CORS Block Avoided / Gateway Error";
        elements.scanState.style.borderColor = "#ff3366";
        elements.scanState.style.color = "#ff3366";
        
        // Populate fallback empty indicators across fields to keep design sleek
        for (const key in elements) {
            if (key !== 'scanState') elements[key].innerText = "Unavailable";
        }
    }
}

window.addEventListener('DOMContentLoaded', runNetworkReconnaissance);
document.getElementById('refreshBtn').addEventListener('click', runNetworkReconnaissance);