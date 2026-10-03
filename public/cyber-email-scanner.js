/**
 * Credential Breach Scanner — client controller
 *
 * Replaces the old inline onclick handler and alert()-based error path.
 * Breach source names come from an external API, so they are inserted as
 * text nodes rather than interpolated into HTML.
 */

const BACKEND_URL = '/api/breach-check';

const form = document.getElementById('breach-form');
const identityInput = document.getElementById('identityInput');
const breachBtn = document.getElementById('breachBtn');
const statusAlert = document.getElementById('statusAlert');
const logOutput = document.getElementById('breachLogOutput');
const spinner = document.getElementById('breachSpinner');

function showAlert(tone, glyph, headline, detail) {
    statusAlert.className = 'alert ' + tone;

    const title = document.createElement('div');
    title.className = 'alert__title';

    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = glyph;

    title.append(icon, document.createTextNode(headline));

    const body = document.createElement('p');
    body.className = 'alert__text';
    body.textContent = detail;

    statusAlert.replaceChildren(title, body);
}

function renderSources(sources) {
    const wrap = document.createElement('div');
    wrap.className = 'breach-log';

    const title = document.createElement('p');
    title.className = 'breach-log__title';
    title.textContent = 'Exposure sources detected';

    const list = document.createElement('ul');
    list.className = 'breach-log__list';

    sources.forEach(function (source) {
        const item = document.createElement('li');
        item.textContent = source;
        list.append(item);
    });

    const remediation = document.createElement('div');
    remediation.className = 'remediation';

    const remTitle = document.createElement('p');
    remTitle.className = 'remediation__title';
    remTitle.textContent = 'Recommended remediation';

    const remList = document.createElement('ul');

    [
        ['Rotate the credential', 'change the password on the affected account immediately, using a high-entropy value.'],
        ['Stop reusing passwords', 'an exposure on one service compromises every service sharing that password.'],
        ['Enable MFA', 'add an authenticator app or hardware key across your accounts.'],
        ['Watch for targeted phishing', 'attackers often reuse breached details to make follow-up lures convincing.']
    ].forEach(function (pair) {
        const item = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = pair[0] + ': ';
        item.append(strong, document.createTextNode(pair[1]));
        remList.append(item);
    });

    remediation.append(remTitle, remList);
    wrap.append(title, list, remediation);
    return wrap;
}

async function executeBreachScan() {
    const identity = identityInput.value.trim();

    if (!identity) {
        showAlert('compromised', '!', 'Input required', 'Enter an email address or username to audit.');
        identityInput.focus();
        return;
    }

    breachBtn.disabled = true;
    statusAlert.classList.add('hidden');
    logOutput.classList.add('hidden');
    logOutput.replaceChildren();
    spinner.classList.remove('hidden');

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: identity })
        });

        if (!response.ok) {
            throw new Error('Backend returned HTTP ' + response.status);
        }

        const data = await response.json();

        if (data.breached) {
            showAlert('compromised', '⚠',
                'Target identity exposed in public breach data',
                'This identifier appears in aggregated breach archives. Treat every credential tied to it as compromised.');

            const sources = Array.isArray(data.sources) ? data.sources : [];
            logOutput.replaceChildren(renderSources(sources));
            logOutput.classList.remove('hidden');
        } else {
            showAlert('safe', '✓',
                'No exposure found',
                'No matches were returned by the breach indexes queried. Absence of a match is not a guarantee of safety.');
        }
    } catch (err) {
        showAlert('compromised', '!',
            'Lookup failed',
            'The scan could not reach the breach verification proxy. Details: ' + err.message);
        console.error('[!] Breach lookup failed:', err);
    } finally {
        spinner.classList.add('hidden');
        breachBtn.disabled = false;
    }
}

form.addEventListener('submit', function (event) {
    event.preventDefault();
    executeBreachScan();
});