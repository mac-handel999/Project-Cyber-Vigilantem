/**
 * Technology Recon Node (WhatWeb) — client controller
 *
 * The previous version wrote badge colours with inline style properties, which
 * ignored the active theme, and hardcoded a localhost endpoint so it only ever
 * worked on the developer's machine. Values are now written with textContent so
 * upstream metadata is never parsed as markup.
 */

const form = document.getElementById('recon-form');
const targetInput = document.getElementById('targetInput');
const scanBtn = document.getElementById('scanBtn');

const ui = {
    state: document.getElementById('reconState'),
    status: document.getElementById('techStatus'),
    server: document.getElementById('techServer'),
    html: document.getElementById('techHtml'),
    title: document.getElementById('techTitle'),
    library: document.getElementById('techLibrary'),
    cms: document.getElementById('techCms'),
    author: document.getElementById('techAuthor'),
    hsts: document.getElementById('techHsts'),
    headers: document.getElementById('techHeaders')
};

/** Relative endpoint so the deployed origin works; no hardcoded localhost. */
const BACKEND_ENDPOINT = '/api/analyze-web';

function setState(text, tone) {
    if (!ui.state) return;
    ui.state.textContent = text;
    ui.state.className = 'badge' + (tone === 'ok' ? ' badge--ok' : tone === 'danger' ? ' badge--danger' : ' badge--warn');
}

function setField(node, value) {
    if (!node) return;
    node.textContent = value === undefined || value === null || value === '' ? 'Not reported' : String(value);
    node.classList.remove('metrics__value--muted');
}

function resetFields() {
    Object.keys(ui).forEach(function (key) {
        if (key === 'state' || !ui[key]) return;
        ui[key].textContent = 'Awaiting scan...';
        ui[key].classList.add('metrics__value--muted');
    });
}

async function dispatchTargetReconnaissance() {
    const target = targetInput.value.trim();

    if (!target) {
        setState('Empty input', 'danger');
        targetInput.focus();
        return;
    }

    scanBtn.disabled = true;
    setState('Analysing...', 'warn');
    resetFields();

    try {
        const response = await fetch(BACKEND_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUrl: target })
        });

        if (!response.ok) {
            throw new Error('Backend infrastructure rejected the request (HTTP ' + response.status + ').');
        }

        const data = await response.json();

        setField(ui.status, '[' + (data.status ?? '?') + '] response received');
        setField(ui.server, data.httpServer);
        setField(ui.html, data.htmlVersion);
        setField(ui.title, data.title);
        setField(ui.library, data.framework);
        setField(ui.cms, data.generator);
        setField(ui.author, data.author);
        setField(ui.hsts, data.hsts);
        setField(ui.headers, data.uncommonHeaders);

        setState('Analysis clear', 'ok');
    } catch (err) {
        setState('Sync fault', 'danger');

        Object.keys(ui).forEach(function (key) {
            if (key === 'state' || !ui[key]) return;
            ui[key].textContent = 'Unavailable';
            ui[key].classList.add('metrics__value--muted');
        });

        if (ui.status) {
            ui.status.textContent = 'Failed to establish telemetry path.';
        }
        if (ui.title) {
            ui.title.textContent = 'Host unreachable or blocking inspection requests.';
        }

        console.error('[!] Recon transit failure:', err.message);
    } finally {
        scanBtn.disabled = false;
    }
}

form.addEventListener('submit', function (event) {
    event.preventDefault();
    dispatchTargetReconnaissance();
});