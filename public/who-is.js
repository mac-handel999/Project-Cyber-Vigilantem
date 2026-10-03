/**
 * Domain & IP Ownership Trace (WHOIS) — client controller
 *
 * Fixes from the previous version:
 *  - SSL status colour was set via inline style, so it ignored the theme;
 *    it is now applied through a data-state attribute
 *  - Errors used alert(), which blocks the page and loses context
 *  - Missing values rendered as "undefined"
 *  - Enter-key handling used the deprecated 'keypress' event
 */

const BACKEND_URL = '/api/whois';

const form = document.getElementById('whois-form');
const targetInput = document.getElementById('whoisTargetInput');
const scanBtn = document.getElementById('whoisScanBtn');
const spinner = document.getElementById('whoisSpinner');
const resultWrapper = document.getElementById('whoisResultWrapper');

const DASH = '—';

function setText(id, value) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = (value === undefined || value === null || value === '') ? DASH : String(value);
}

/** Classifies the certificate verdict so the theme can colour it. */
function applySslState(statusText) {
    const node = document.getElementById('resSslStatus');
    if (!node) return;

    const upper = String(statusText || '').toUpperCase();
    if (upper.includes('NOT APPLICABLE')) {
        node.dataset.state = 'n-a';
    } else if (upper.includes('VALID')) {
        node.dataset.state = 'valid';
    } else {
        node.dataset.state = 'invalid';
    }
}

/* Separate element so error text never fights with the spinner markup */
const errorBanner = document.getElementById('whoisError');
let errorTimer = null;

function showError(message) {
    clearTimeout(errorTimer);
    errorBanner.textContent = message;
    errorBanner.classList.remove('hidden');
    errorTimer = setTimeout(function () {
        errorBanner.classList.add('hidden');
    }, 5000);
}

async function executeWhoisTrace() {
    const target = targetInput.value.trim();

    if (!target) {
        showError('Provide a valid target domain or IP address to trace.');
        targetInput.focus();
        return;
    }

    scanBtn.disabled = true;
    errorBanner.classList.add('hidden');
    spinner.classList.remove('hidden');
    resultWrapper.classList.add('hidden');

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: target })
        });

        if (!response.ok) {
            throw new Error('Backend returned HTTP ' + response.status);
        }

        const data = await response.json();

        if (!data.success) {
            showError('WHOIS resolution error: ' + (data.error || 'no record returned'));
            return;
        }

        setText('resDomain', data.target);
        setText('resRegistrar', data.provider);
        setText('resCreated', data.created);
        setText('resExpires', data.expires);
        setText('resUpdated', data.updated);
        setText('resStatus', data.status);

        setText('resNameservers', Array.isArray(data.nameservers)
            ? data.nameservers.join('\n')
            : data.nameservers);

        const ssl = data.ssl || {};
        const sslStatus = ssl.status || DASH;
        setText('resSslStatus', sslStatus);

        if (sslStatus !== DASH && ssl.daysRemaining !== undefined && ssl.daysRemaining !== null) {
            document.getElementById('resSslStatus').textContent +=
                ' (' + ssl.daysRemaining + ' days left)';
        }
        applySslState(sslStatus);

        setText('resSslIssuer', ssl.issuer);
        setText('resSslExpires', ssl.expires);

        const rawLog = document.getElementById('whoisRawLog');
        if (rawLog) rawLog.textContent = data.raw_log || 'No raw record returned.';

        resultWrapper.classList.remove('hidden');
    } catch (err) {
        showError('Pipeline synchronisation failed: ' + err.message);
        console.error('[!] WHOIS request failed:', err.message);
    } finally {
        spinner.classList.add('hidden');
        scanBtn.disabled = false;
    }
}

form.addEventListener('submit', function (event) {
    event.preventDefault();
    executeWhoisTrace();
});