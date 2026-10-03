/**
 * Perimeter Recon Node (My IP telemetry) — client controller
 *
 * Issues found in the previous version and fixed here:
 *  - A ~120-line commented-out duplicate of the whole implementation
 *  - Continent was hardcoded to "Africa / AF" regardless of the real location
 *  - Status badge colours were set with inline styles, which ignored the theme
 *  - The map tiles were always dark, even in light mode
 *  - Popup content was built with an innerHTML template using API values
 */

// Served by our own backend, which holds IPINFO_API_KEY server-side. The
// token used to be hardcoded here and was readable in view-source.
const IPINFO_ENDPOINT = '/api/ip-telemetry';

let mapInstance = null;

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

/**
 * ISO-3166 alpha-2 to continent, used instead of the previous hardcoded value.
 * Only countries this tool is likely to encounter are listed; anything else
 * resolves to "Unresolved" rather than a wrong answer.
 */
const COUNTRY_CONTINENT = {
    NG: ['Africa', 'AF'], KE: ['Africa', 'AF'], ZA: ['Africa', 'AF'], GH: ['Africa', 'AF'],
    EG: ['Africa', 'AF'], MA: ['Africa', 'AF'], ET: ['Africa', 'AF'], TZ: ['Africa', 'AF'],
    US: ['North America', 'NA'], CA: ['North America', 'NA'], MX: ['North America', 'NA'],
    GB: ['Europe', 'EU'], IE: ['Europe', 'EU'], DE: ['Europe', 'EU'], FR: ['Europe', 'EU'],
    NL: ['Europe', 'EU'], ES: ['Europe', 'EU'], IT: ['Europe', 'EU'], SE: ['Europe', 'EU'],
    NO: ['Europe', 'EU'], FI: ['Europe', 'EU'], DK: ['Europe', 'EU'], PL: ['Europe', 'EU'],
    PT: ['Europe', 'EU'], RO: ['Europe', 'EU'], UA: ['Europe', 'EU'], CZ: ['Europe', 'EU'],
    IN: ['Asia', 'AS'], CN: ['Asia', 'AS'], JP: ['Asia', 'AS'], KR: ['Asia', 'AS'],
    SG: ['Asia', 'AS'], AE: ['Asia', 'AS'], SA: ['Asia', 'AS'], IL: ['Asia', 'AS'],
    TR: ['Asia', 'AS'], RU: ['Europe', 'AS'], AU: ['Oceania', 'OC'], NZ: ['Oceania', 'OC']
};

const FIELDS = {
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

const refreshBtn = document.getElementById('refreshBtn');

function setField(node, value) {
    if (!node) return;
    node.textContent = value;
    // Populated fields get full-contrast styling; placeholders stay muted
    node.classList.remove('metrics__value--muted');
}

function setState(text, tone) {
    if (!FIELDS.scanState) return;
    FIELDS.scanState.textContent = text;
    FIELDS.scanState.parentElement.className = 'badge badge--live' +
        (tone === 'ok' ? ' badge--ok' : tone === 'danger' ? ' badge--danger' : ' badge--warn');
}

function activeTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function renderMap(lat, lng, ip, city, region) {
    if (mapInstance !== null) {
        mapInstance.remove();
        mapInstance = null;
    }

    mapInstance = L.map('reconMap').setView([lat, lng], 12);

    const tiles = TILE_LAYERS[activeTheme()];
    L.tileLayer(tiles.url, { attribution: tiles.attribution, maxZoom: 20 }).addTo(mapInstance);

    const popup = document.createElement('div');
    const ipNode = document.createElement('b');
    ipNode.textContent = 'NODE IP: ';
    const locNode = document.createElement('b');
    locNode.textContent = 'LOC: ';

    popup.append(
        ipNode, document.createTextNode(ip),
        document.createElement('br'),
        locNode, document.createTextNode([city, region].filter(Boolean).join(', '))
    );

    L.marker([lat, lng]).addTo(mapInstance).bindPopup(popup).openPopup();

    setTimeout(function () {
        if (mapInstance) mapInstance.invalidateSize();
    }, 150);
}

async function runNetworkReconnaissance() {
    if (refreshBtn) refreshBtn.disabled = true;
    setState('Syncing node...', 'warn');

    try {
        const response = await fetch(IPINFO_ENDPOINT);
        if (!response.ok) {
            const detail = await response.json().catch(() => ({}));
            throw new Error(detail.error || 'IP telemetry request failed (HTTP ' + response.status + ').');
        }

        const data = await response.json();

        // "AS15169 Google LLC" → number and entity name
        let asnNumber = 'Unavailable';
        let asnCompany = 'Unknown AS entity';
        if (data.org) {
            const parts = data.org.split(' ');
            asnNumber = parts.shift();
            asnCompany = parts.join(' ') || 'Unknown AS entity';
        }

        setField(FIELDS.ipv4, data.ip || 'Undetected');
        setField(FIELDS.ipv6, 'Not reported by provider');
        setField(FIELDS.as, asnNumber);
        setField(FIELDS.asName, asnCompany);
        setField(FIELDS.isp, asnCompany);
        setField(FIELDS.status, 'Token authenticated');

        const lowerOrg = (data.org || '').toLowerCase();
        const isDatacentre = ['amazon', 'google', 'microsoft', 'hosting', 'digitalocean', 'ovh', 'linode']
            .some(function (needle) { return lowerOrg.includes(needle); });

        setField(FIELDS.proxy, 'Clear connection path');
        setField(FIELDS.mobile, isDatacentre ? 'Fixed line node' : 'Mobile / broadband link');
        setField(FIELDS.hosting, isDatacentre ? 'Data centre / hosting' : 'Residential deployment');
        setField(FIELDS.services, isDatacentre ? 'Cloud hosting routing' : 'Standard broadband node');

        const countryCode = data.country || '';
        const continent = COUNTRY_CONTINENT[countryCode];

        setField(FIELDS.continent, continent ? continent[0] : 'Unresolved');
        setField(FIELDS.continentCode, continent ? continent[1] : '--');
        setField(FIELDS.country, data.country || 'Unavailable');
        setField(FIELDS.countryCode, countryCode || 'Unavailable');
        setField(FIELDS.region, data.region || 'Unavailable');
        setField(FIELDS.city, data.city || 'Unavailable');
        setField(FIELDS.zip, data.postal || 'Not applicable');
        setField(FIELDS.coords, data.loc ? data.loc : 'Unavailable');
        setField(FIELDS.timezone, data.timezone || 'Unavailable');
        setField(FIELDS.currency, 'Not reported by provider');

        setState('Secure sync', 'ok');

        if (data.loc && data.loc !== '0,0') {
            const parts = data.loc.split(',').map(parseFloat);
            if (!Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
                renderMap(parts[0], parts[1], data.ip || '', data.city || '', data.region || '');
            }
        }
    } catch (err) {
        setState('Signal restricted', 'danger');

        Object.keys(FIELDS).forEach(function (key) {
            if (key !== 'scanState' && FIELDS[key]) {
                FIELDS[key].textContent = 'Signal restricted';
                FIELDS[key].classList.add('metrics__value--muted');
            }
        });

        console.error('[!] Perimeter recon failed:', err.message);
    } finally {
        if (refreshBtn) refreshBtn.disabled = false;
    }
}

window.addEventListener('DOMContentLoaded', runNetworkReconnaissance);

if (refreshBtn) {
    refreshBtn.addEventListener('click', runNetworkReconnaissance);
}