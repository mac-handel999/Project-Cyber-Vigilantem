async function runNetworkReconnaissance() {
    // Collect UI target pointers
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

    // Initialize loading indicator colors
    elements.scanState.innerText = "Scanning...";
    elements.scanState.style.borderColor = "#ffaa00";
    elements.scanState.style.color = "#ffaa00";

    const fetchWithTimeout = (url, options, timeout = 3000) => {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]);
    };

    let detectedPublicIp = "";

    // 1. Audit IPv4 Channel
    try {
        const ipv4Res = await fetch('https://api.ipify.org?format=json');
        const ipv4Data = await ipv4Res.json();
        elements.ipv4.innerText = ipv4Data.ip;
        detectedPublicIp = ipv4Data.ip;
    } catch (err) {
        elements.ipv4.innerText = "Not detected";
    }

    // 2. Audit IPv6 Channel
    try {
        const ipv6Res = await fetchWithTimeout('https://api6.ipify.org?format=json', {}, 2500);
        const ipv6Data = await ipv6Res.json();
        elements.ipv6.innerText = ipv6Data.ip;
        if (!detectedPublicIp) detectedPublicIp = ipv6Data.ip;
    } catch (err) {
        elements.ipv6.innerText = "Not detected";
    }

    if (!detectedPublicIp) {
        setTelemetryFailureStates("Network Offline");
        return;
    }

    // 3. Execution Data Query Pipeline Loop
    try {
        // --- LAYER A: PRIMARY API REGISTRY HANDSHAKE ---
        const geoRes = await fetch(`https://freeipapi.com/api/json/${detectedPublicIp}`);
        if (!geoRes.ok) throw new Error("Primary node dropped registry connection.");
        const d = await geoRes.json();

        // Map data keys returned out of FreeIPAPI payload array schema rules
        elements.as.innerText = d.asNumber ? `AS${d.asNumber}` : "Unavailable";
        elements.asName.innerText = d.asName || "Unknown AS Pool";
        elements.isp.innerText = d.asName || "Unknown ISP Node";
        elements.status.innerText = "SUCCESS (Primary Node Sync)";
        
        elements.proxy.innerText = d.isProxy ? "Detected (Active Mask)" : "Clear Connection Path";
        elements.mobile.innerText = "Unsupported by primary registry metadata"; 
        elements.hosting.innerText = "Unsupported by primary registry metadata";
        elements.services.innerText = d.isProxy ? "Anonymized Proxy / VPN Client Node" : "Standard Consumer Infrastructure Data";

        elements.continent.innerText = d.continentName || "Unavailable";
        elements.continentCode.innerText = d.continentCode || "Unavailable";
        elements.country.innerText = d.countryName || "Unavailable";
        elements.countryCode.innerText = d.countryCode || "Unavailable";
        elements.region.innerText = d.regionName || "Unavailable";
        elements.city.innerText = d.cityName || "Unavailable";
        elements.zip.innerText = d.zipCode || "Not applicable";
        elements.coords.innerText = `Lat: ${d.latitude || '0'} / Long: ${d.longitude || '0'}`;
        elements.timezone.innerText = d.timeZone || "Unavailable";
        elements.currency.innerText = d.currency?.name ? `${d.currency.name} (${d.currency.code})` : "Unavailable";

        setTelemetrySuccessState();

    } catch (primaryErr) {
        console.warn("[!] Primary registry boundary dropped query loop. Launching Secondary Failover...", primaryErr.message);
        
        try {
            // --- LAYER B: SECONDARY REGISTRY SYSTEM (IP-API Fields Parameter Extension) ---
            // Passing explicit query fields parameters down to ip-api endpoint to get extended variables mapping back
            const backupFields = "status,message,continent,continentCode,country,countryCode,regionName,city,zip,lat,lon,timezone,currency,isp,org,as,asname,mobile,proxy,hosting";
            const backupRes = await fetch(`http://ip-api.com/json/${detectedPublicIp}?fields=${backupFields}`);
            if (!backupRes.ok) throw new Error("Secondary gateway rejected sync initialization.");
            const b = await backupRes.json();

            if (b.status === "fail") throw new Error(b.message);

            // Map variables out of secondary registry payload framework keys
            elements.as.innerText = b.as ? b.as.split(" ")[0] : "Unavailable";
            elements.asName.innerText = b.asname || "Unknown AS Entity";
            elements.isp.innerText = b.isp || "Unknown ISP Engine";
            elements.status.innerText = "SUCCESS (Secondary Failover Match)";

            elements.proxy.innerText = b.proxy ? "Detected (Active Mask)" : "Clear Connection Path";
            elements.mobile.innerText = b.mobile ? "Cellular Mobile Node Grid" : "Fixed Line/Broadband Network";
            elements.hosting.innerText = b.hosting ? "Data Center / Hosting Infra" : "Residential/Consumer Allocation";
            elements.services.innerText = b.hosting ? "Cloud Hosting Routing Node" : (b.mobile ? "Mobile Telecom Asset" : "Standard Broadband Allocation");

            elements.continent.innerText = b.continent || "Unavailable";
            elements.continentCode.innerText = b.continentCode || "Unavailable";
            elements.country.innerText = b.country || "Unavailable";
            elements.countryCode.innerText = b.countryCode || "Unavailable";
            elements.region.innerText = b.regionName || "Unavailable";
            elements.city.innerText = b.city || "Unavailable";
            elements.zip.innerText = b.zip || "Not applicable";
            elements.coords.innerText = `Lat: ${b.lat || '0'} / Long: ${b.lon || '0'}`;
            elements.timezone.innerText = b.timezone || "Unavailable";
            elements.currency.innerText = b.currency || "Unavailable";

            setTelemetrySuccessState();

        } catch (secondaryErr) {
            console.error("[!] Master registry infrastructure matrix offline:", secondaryErr.message);
            setTelemetryFailureStates("Critical Sync Fault");
        }
    }

    function setTelemetrySuccessState() {
        elements.scanState.innerText = "Secure Sync";
        elements.scanState.style.borderColor = "var(--neon-mint)";
        elements.scanState.style.color = "var(--neon-mint)";
    }

    function setTelemetryFailureStates(errMsg) {
        elements.scanState.innerText = errMsg;
        elements.scanState.style.borderColor = "#ff3366";
        elements.scanState.style.color = "#ff3366";

        for (const key in elements) {
            if (key !== 'scanState' && key !== 'ipv4' && key !== 'ipv6') {
                elements[key].innerText = "Unavailable";
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', runNetworkReconnaissance);
document.getElementById('refreshBtn').addEventListener('click', runNetworkReconnaissance);