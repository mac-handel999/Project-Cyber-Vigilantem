/**
 * Safe Browse URL Checker — client controller
 *
 * Renders results through semantic class names rather than inline styles, so
 * the light and dark themes both apply correctly. Results are built with DOM
 * APIs and textContent to avoid injecting untrusted API values as HTML.
 */

// ==========================================
// DYNAMIC PORT & ENVIRONMENT DETECTION
// ==========================================

const BACKEND_URL = '/api/check-url';

/** Loose structural check: optional protocol, then host with a TLD or IPv4. */
function isValidURL(value) {
    const urlPattern = new RegExp(
        '^(https?:\\/\\/)?' +
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
        '((\\d{1,3}\\.){3}\\d{1,3}))' +
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
        '(\\?[;&a-z\\d%_.~+=-]*)?' +
        '(\\#[-a-z\\d_]*)?$', 'i'
    );
    return urlPattern.test(value);
}

const form = document.getElementById('scan-form');
const urlInput = document.getElementById('input-bar');
const resultContainer = document.getElementById('resultContainer');
const searchBtn = document.getElementById('search-btn');

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

/**
 * Replaces the contents of the result panel.
 * @param {'info'|'ok'|'danger'|'warn'} tone
 */
function renderResult(tone, headline, buildBody) {
    resultContainer.className = 'result result--' + tone;

    const head = el('div', 'result__headline');
    head.append(el('span', null, headline));

    const body = el('div', 'result__body');
    buildBody(body);

    resultContainer.replaceChildren(head, body);
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderList(target, entries) {
    const list = el('ul', 'result__list');
    entries.forEach(function (entry) {
        const item = el('li');
        item.append(el('strong', null, entry[0] + ': '), document.createTextNode(entry[1]));
        list.append(item);
    });
    target.append(list);
}

function setLoading(isLoading) {
    resultContainer.className = isLoading ? 'result' : resultContainer.className;
    if (isLoading) {
        const box = el('div', 'loading');
        box.append(el('span', 'loading__ring'), document.createTextNode('Scanning URL vectors via Google Safe Browsing...'));
        resultContainer.replaceChildren(box);
    }
    searchBtn.disabled = isLoading;
}

async function runScan() {
    const urlToCheck = urlInput.value.trim();

    if (!urlToCheck) {
        renderResult('warn', 'Input required', function (body) {
            body.append(el('p', null, 'Enter a URL or domain name to run a safety check.'));
        });
        urlInput.focus();
        return;
    }

    if (!isValidURL(urlToCheck)) {
        renderResult('warn', 'Invalid input structure', function (body) {
            body.append(el('p', null, "Enter a proper web address, for example 'example.com' or 'https://example.com'."));
        });
        urlInput.focus();
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urlToCheck: urlToCheck })
        });

        if (!response.ok) {
            throw new Error('Backend returned HTTP ' + response.status);
        }

        const data = await response.json();

        if (Array.isArray(data.matches) && data.matches.length > 0) {
            // UNCLEAN / MALICIOUS THREAT DETECTED
            renderResult('danger', 'CRITICAL SECURITY ALERT', function (body) {
                body.append(el('p', null,
                    'This link is blacklisted and classified unsafe by Google Safe Browsing engines.'));

                body.append(el('hr'));

                body.append(el('strong', null, 'Threat intelligence logs:'));

                const list = el('ul', 'result__list');
                data.matches.forEach(function (match) {
                    const item = el('li');
                    item.append(
                        el('strong', null, 'Threat category: '),
                        document.createTextNode(String(match.threatType || 'unknown').replace(/_/g, ' ')),
                        el('br'),
                        el('strong', null, 'Target platform: '),
                        document.createTextNode(String(match.platformType || 'unknown').replace(/_/g, ' ')),
                        el('br'),
                        el('strong', null, 'Indicator type: '),
                        document.createTextNode(match.threatEntryType || 'unspecified')
                    );
                    list.append(item);
                });
                body.append(list);

                body.append(el('p', 'result__footnote',
                    'Recommendation: close this tab immediately. Do not enter personal identifiers, keys or passwords on the target interface.'));
            });
        } else {
            // CLEAN / SECURE RESPONSE
            const scanTime = new Date().toLocaleTimeString();

            renderResult('ok', 'SCAN CLEAN / NO THREATS FOUND', function (body) {
                body.append(el('p', null,
                    'The target was successfully processed against the current threat matrices.'));
                body.append(el('hr'));
                renderList(body, [
                    ['Target URL status', 'Verified unflagged'],
                    ['Database match status', '0 records matched'],
                    ['Scan completion time', scanTime],
                    ['Verification authority', 'Google Safe Browsing v4 Network API']
                ]);
                body.append(el('p', 'result__footnote',
                    'An unflagged result is not a guarantee of safety. Always verify the sender before interacting with external links.'));
            });
        }
    } catch (err) {
        renderResult('danger', 'System error', function (body) {
            body.append(el('p', null,
                'Unable to establish contact with the backend pipeline proxy.'));
            body.append(el('span', 'result__endpoint', 'Attempted endpoint: ' + BACKEND_URL));
            console.error('[!] URL scan failed:', err);
        });
    } finally {
        searchBtn.disabled = false;
    }
}

form.addEventListener('submit', function (event) {
    event.preventDefault();
    runScan();
});