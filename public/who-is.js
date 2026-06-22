// Automatically swaps between local developer server testing ports and your Vercel URL
const WHOIS_BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5500/api/whois'
    : '/api/whois';

async function executeWhoisTrace() {
    const targetInput = document.getElementById('whoisTargetInput').value.trim();
    const resultWrapper = document.getElementById('whoisResultWrapper');
    const spinner = document.getElementById('whoisSpinner');
    
    if (!targetInput) {
        alert("Please provide a valid target domain identifier layout sequence.");
        return;
    }

    // Toggle visibility grids to loading state
    spinner.classList.remove('hidden');
    resultWrapper.classList.add('hidden');

    try {
        const response = await fetch(WHOIS_BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: targetInput })
        });

        const data = await response.json();
        spinner.classList.add('hidden');

        if (data.success) {
            // Unhide presentation view layers
            resultWrapper.classList.remove('hidden');

// Add these lines inside your successful response block 'if (data.success) { ... }'
document.getElementById('resDomain').innerText = data.target;
document.getElementById('resRegistrar').innerText = data.provider;
document.getElementById('resCreated').innerText = data.created;
document.getElementById('resExpires').innerText = data.expires;
document.getElementById('resStatus').innerText = data.status;

// Parse cryptographic evaluation matrix outputs
const sslStatusEl = document.getElementById('resSslStatus');
sslStatusEl.innerText = data.ssl.status;

if (data.ssl.status.includes("VALID")) {
    sslStatusEl.style.color = "#00ffcc"; // Neon Green stable flag
    sslStatusEl.innerText += ` (${data.ssl.daysRemaining} Days Left)`;
} else if (data.ssl.status.includes("NOT APPLICABLE")) {
    sslStatusEl.style.color = "#64748b"; // Low emphasis grey flag for IP inputs
} else {
    sslStatusEl.style.color = "#ff3366"; // Alert Red flag status
}

document.getElementById('resSslIssuer').innerText = data.ssl.issuer;
document.getElementById('resSslExpires').innerText = data.ssl.expires;
document.getElementById('whoisRawLog').textContent = data.raw_log;
        } else {
            alert(`⚠️ WHOIS Resolution Error: ${data.error}`);
        }

    } catch (err) {
        spinner.classList.add('hidden');
        console.error("[!] WHOIS client framework handling runtime failure:", err.message);
        alert("Fatal error running pipeline synchronization with WHOIS microservice backplane.");
    }
}

// Bind event hooks once DOM parameters resolve
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('whoisScanBtn')?.addEventListener('click', executeWhoisTrace);
    
    // Allow users to drop execute scans instantly by hitting 'Enter' inside the text box field
    document.getElementById('whoisTargetInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeWhoisTrace();
    });
});