
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5500/api/breach-check'
    : '/api/breach-check';

async function executeBreachScan() {
    const identityInput = document.getElementById('identityInput').value.trim();
    const statusAlert = document.getElementById('statusAlert');
    const logOutput = document.getElementById('breachLogOutput');
    const spinner = document.getElementById('breachSpinner');

    if (!identityInput) return alert("Identity input vector required.");

    spinner.classList.remove('hidden');
    statusAlert.classList.add('hidden');
    logOutput.classList.add('hidden');

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: identityInput })
        });
        const data = await response.json();
        spinner.classList.add('hidden');

        if (data.breached) {
            statusAlert.className = "alert-banner compromised";
            statusAlert.innerHTML = `⚠️ ALERT: TARGET SYSTEM EXPOSED IN COLD ARRAYS!`;
            statusAlert.classList.remove('hidden');

            logOutput.innerHTML = `
                <h4>🚨 ARCHIVED COMPROMISE SOURCES DETECTED:</h4>
                <ul>
                    ${data.sources.map(src => `<li><strong>Source Database:</strong> ${src}</li>`).join('')}
                </ul>
            `;
            logOutput.classList.remove('hidden');
        } else {
            statusAlert.className = "alert-banner safe";
            statusAlert.innerHTML = `✅ SECURE: Record clear across known index pools.`;
            statusAlert.classList.remove('hidden');
        }
    } catch (err) {
        spinner.classList.add('hidden');
        alert("Communication fault processing query handshake against core cloud nodes.");
    }
}