// Server Proxy Endpoints
const BACKEND_URL = 'http://localhost:5000/api';

// Tab Switching Mechanism
function switchTab(event, tabId) {
    const contentPanes = document.querySelectorAll('.tab-content');
    contentPanes.forEach(pane => pane.classList.remove('active'));

    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// ==========================================
// VALIDATION HELPER FUNCTIONS
// ==========================================

// 1. Strict URL Format Validator
function isValidURL(string) {
    const urlPattern = new RegExp(
        '^(https?:\\/\\/)?' + // Optional protocol (http or https)
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // Valid domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // Port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // Query string
        '(\\#[-a-z\\d_]*)?$', 'i' // Fragment locator
    );
    return urlPattern.test(string);
}

// 2. Strict Email Format Validator
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}


// ==========================================
// 1. URL Shield Logic (With Format Checker)
// ==========================================
document.getElementById('urlCheckBtn').addEventListener('click', async () => {
    const urlInput = document.getElementById('urlInput').value.trim();
    const resultDiv = document.getElementById('urlResultContainer');
    
    if (!urlInput) {
        alert("Please enter a URL.");
        return;
    }
    
    // FORMAT VALIDATION CHECK
    if (!isValidURL(urlInput)) {
        resultDiv.style.display = 'block';
        resultDiv.style.backgroundColor = '#fff3cd'; // Yellow warning box
        resultDiv.style.color = '#856404';
        resultDiv.innerHTML = "<strong>Invalid Input:</strong> Please enter a valid URL structure (e.g., 'example.com' or 'https://google.com').";
        return; // Stops execution before calling backend
    }

    resultDiv.style.display = 'block';
    resultDiv.style.backgroundColor = '#e2e3e5';
    resultDiv.style.color = '#383d41';
    resultDiv.innerHTML = "Querying Safe Browsing engine...";

    try {
        const res = await fetch(`${BACKEND_URL}/check-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urlToCheck: urlInput })
        });
        const data = await res.json();

        if (data.matches) {
            resultDiv.style.backgroundColor = '#f8d7da';
            resultDiv.style.color = '#721c24';
            resultDiv.innerHTML = `<strong>Threat Found:</strong> Flagged malicious content detected.`;
        } else {
            resultDiv.style.backgroundColor = '#d4edda';
            resultDiv.style.color = '#155724';
            resultDiv.innerHTML = `<strong>Clean:</strong> No immediate threats reported by Google.`;
        }
    } catch (err) {
        resultDiv.innerHTML = "Error contacting backend endpoint.";
    }
});

// ==========================================
// 2. Identity Guard Logic (With Format Checker)
// ==========================================
document.getElementById('emailCheckBtn').addEventListener('click', async () => {
    const emailInput = document.getElementById('emailInput').value.trim();
    const resultDiv = document.getElementById('emailResultContainer');

    if (!emailInput) {
        alert("Please enter an email address.");
        return;
    }

    // FORMAT VALIDATION CHECK
    if (!isValidEmail(emailInput)) {
        resultDiv.style.display = 'block';
        resultDiv.style.backgroundColor = '#fff3cd'; // Yellow warning box
        resultDiv.style.color = '#856404';
        resultDiv.innerHTML = "<strong>Invalid Format:</strong> Please provide a valid email address (e.g., name@domain.com).";
        return; // Stops execution before calling backend
    }

    resultDiv.style.display = 'block';
    resultDiv.style.backgroundColor = '#e2e3e5';
    resultDiv.style.color = '#383d41';
    resultDiv.innerHTML = "Scanning breach dumps...";

    try {
        const res = await fetch(`${BACKEND_URL}/check-email-breach`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailToCheck: emailInput })
        });
        const data = await res.json();

        if (data.breached) {
            resultDiv.style.backgroundColor = '#f8d7da';
            resultDiv.style.color = '#721c24';
            const leaks = data.breaches.map(b => `<li>${b.Title}</li>`).join('');
            resultDiv.innerHTML = `<strong>Exposed!</strong> Email found in compromises: <ul>${leaks}</ul>`;
        } else {
            resultDiv.style.backgroundColor = '#d4edda';
            resultDiv.style.color = '#155724';
            resultDiv.innerHTML = `<strong>Secure:</strong> Identity records appear uncompromised.`;
        }
    } catch (err) {
        resultDiv.innerHTML = "Error contacting backend endpoint.";
    }
});

// ==========================================
// 3. Vulnerability Radar Logic (Pentester.com)
// ==========================================
document.getElementById('domainCheckBtn').addEventListener('click', async () => {
    const domainInput = document.getElementById('domainInput').value.trim();
    const resultDiv = document.getElementById('domainResultContainer');

    if (!domainInput) {
        alert("Please enter a domain.");
        return;
    }

    // Reuse URL validator to ensure domain pattern looks accurate
    if (!isValidURL(domainInput)) {
        resultDiv.style.display = 'block';
        resultDiv.style.backgroundColor = '#fff3cd';
        resultDiv.style.color = '#856404';
        resultDiv.innerHTML = "<strong>Invalid Domain:</strong> Please enter a proper domain root name (e.g., targetcompany.com).";
        return;
    }

    resultDiv.style.display = 'block';
    resultDiv.style.backgroundColor = '#e2e3e5';
    resultDiv.style.color = '#383d41';
    resultDiv.innerHTML = "Initiating remote security configuration scan...";

    try {
        const res = await fetch(`${BACKEND_URL}/scan-domain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domainToScan: domainInput })
        });
        const data = await res.json();

        if (data.success) {
            resultDiv.style.backgroundColor = '#d1ecf1';
            resultDiv.style.color = '#0c5460';
            resultDiv.innerHTML = `<strong>Audit Complete:</strong> Scan routine executed successfully. View raw console data payload for indicators.`;
            console.log("Pentester Scan Data:", data.scanData);
        }
    } catch (err) {
        resultDiv.innerHTML = "Error launching vulnerability audit framework.";
    }
});