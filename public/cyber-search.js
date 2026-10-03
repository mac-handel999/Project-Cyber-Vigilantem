/**
 * Threat Research Engine — client controller
 *
 * The previous version had no error handling, no loading state and no input
 * validation. This version covers all three and renders the AI report with
 * textContent so returned text is never interpreted as markup.
 */

const BACKEND_URL = '/api/research';

const form = document.getElementById('research-form');
const queryInput = document.getElementById('query');
const output = document.getElementById('output');
const researchBtn = document.getElementById('research-btn');

function setState(mode, message) {
    output.classList.toggle('is-loading', mode === 'loading');
    output.classList.toggle('is-error', mode === 'error');
    if (message !== undefined) {
        output.textContent = message;
    }
}

async function runResearch() {
    const query = queryInput.value.trim();

    if (!query) {
        setState('error', 'Enter a research query — a CVE identifier, threat actor name, or defensive topic.');
        queryInput.focus();
        return;
    }

    setState('loading', 'Scanning threat intelligence sources...');
    researchBtn.disabled = true;

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            throw new Error('Backend returned HTTP ' + response.status);
        }

        const data = await response.json();

        if (typeof data.report === 'string' && data.report.trim()) {
            setState(null, data.report);
        } else {
            setState('error', 'The research pipeline returned an empty report. Try a narrower query.');
        }
    } catch (err) {
        setState('error',
            'Research request failed. The backend pipeline may be unavailable. Details: ' + err.message);
        console.error('[!] Research request failed:', err);
    } finally {
        researchBtn.disabled = false;
    }
}

form.addEventListener('submit', function (event) {
    event.preventDefault();
    runResearch();
});

// Preset chips populate the query and immediately run the search
document.querySelectorAll('[data-query]').forEach(function (chip) {
    chip.addEventListener('click', function () {
        queryInput.value = chip.getAttribute('data-query');
        runResearch();
    });
});