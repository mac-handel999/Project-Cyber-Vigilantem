/**
 * Geo IP Recon Scanner — client controller
 *
 * Switched from the duplicated click handler + inline HTML to a form submit
 * handler. The raw telemetry log is written as text so upstream log content
 * is never parsed as markup, and map tiles follow the active theme.
 */

const BACKEND_URL = '/api/geoip';

// Tracks the live map so it can be torn down cleanly between scans
let geoMapInstance = null;

/** Tile sets matched to each theme so the map stays legible after a toggle. */
const TILE_LAYERS = {
    dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    },
    light: {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    }
};

const form = document.getElementById('geo-form');
const targetInput = document.getElementById('geoTargetInput');
const scanBtn = document.getElementById('geoScanBtn');
const logOutput = document.getElementById('geoLogOutput');
const mapWrapper = document.getElementById('geoMapWrapper');
const spinner = document.getElementById('geoSpinner');

function activeTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function renderMap(lat, lng, target) {
    // Unhide before mounting so the container has a measurable size
    mapWrapper.classList.remove('hidden');

    // Leaflet is loaded from a CDN. If it is blocked, offline, or stripped by
    // an extension, the scan itself still succeeded, so the map is optional
    // and must never take the telemetry result down with it.
    if (typeof L === 'undefined') {
        console.warn('[!] Leaflet unavailable; showing coordinates without the map.');
        const note = document.createElement('div');
        note.className = 'alert alert--warn';
        note.textContent = 'Map tiles could not be loaded, so the interactive view is unavailable. '
            + 'Coordinates above are still accurate.';
        mapWrapper.append(note);
        return;
    }

    // Rebuild the section so a repeated scan does not stack notices
    mapWrapper.querySelectorAll('.alert').forEach(function (node) { node.remove(); });

    if (geoMapInstance !== null) {
        geoMapInstance.remove();
        geoMapInstance = null;
    }

    geoMapInstance = L.map('liveGeoMap').setView([lat, lng], 13);

    const tiles = TILE_LAYERS[activeTheme()];
    L.tileLayer(tiles.url, { attribution: tiles.attribution, maxZoom: 20 }).addTo(geoMapInstance);

    const marker = L.marker([lat, lng]).addTo(geoMapInstance);

    const popup = document.createElement('div');
    const nameNode = document.createElement('b');
    nameNode.textContent = 'TARGET: ';
    const coordsNode = document.createElement('b');
    coordsNode.textContent = 'COORDS: ';

    popup.append(
        nameNode, document.createTextNode(target),
        document.createElement('br'),
        coordsNode, document.createTextNode(lat.toFixed(5) + ', ' + lng.toFixed(5))
    );

    marker.bindPopup(popup).openPopup();

    // Leaflet caches container dimensions; force a recalculation
    setTimeout(function () {
        if (geoMapInstance) geoMapInstance.invalidateSize();
    }, 150);
}

async function executeGeoScan() {
    const target = targetInput.value.trim();

    if (!target) {
        logOutput.textContent = '⚠ Specify a target IP address or domain name.';
        logOutput.classList.remove('hidden');
        targetInput.focus();
        return;
    }

    scanBtn.disabled = true;
    spinner.classList.remove('hidden');
    logOutput.classList.add('hidden');
    mapWrapper.classList.add('hidden');

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: target })
        });

        if (!response.ok) {
            throw new Error('Backend returned HTTP ' + response.status);
        }

        const data = await response.json();

        if (!data.success) {
            logOutput.textContent = '⚠ Scan exception: ' + (data.error || 'no telemetry returned');
            logOutput.classList.remove('hidden');
            return;
        }

        logOutput.textContent = '[+] GEOLOCATION RESOLUTION LOGS:\n\n' + (data.raw_log || 'No telemetry body returned.');
        logOutput.classList.remove('hidden');

        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);

        // 0/0 is the API's "unknown" sentinel, not a real coordinate
        if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0) {
            renderMap(lat, lng, target);
        }
    } catch (err) {
        logOutput.textContent = '⚠ Scan failed: ' + err.message;
        logOutput.classList.remove('hidden');
        console.error('[!] GeoIP scan failed:', err);
    } finally {
        spinner.classList.add('hidden');
        scanBtn.disabled = false;
    }
}

form.addEventListener('submit', function (event) {
    event.preventDefault();
    executeGeoScan();
});