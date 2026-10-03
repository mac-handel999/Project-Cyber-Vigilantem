const CACHE_NAME = 'vigilanteem-v7';

// Resolve every precache entry against the worker's own scope instead of the
// origin root. The script can be registered from a prefixed mount (for example
// /public/ when a Live Server extension serves the repo root), and root-anchored
// URLs would then miss the cache while still reporting success.
const BASE = new URL('./', self.location.href).pathname;
const scoped = (path) => BASE + path.replace(/^\//, '');

// Only the API prefix is matched by origin-relative path, so it stays root-based.
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/project.html',
    '/cyber-search.html',
    '/cyber-edu-tech.html',
    '/cyber-email-scanner.html',
    '/cyber-geo-ip.html',
    '/whats-my-ip.html',
    '/what-web.html',
    '/who-is.html',
    '/cyber-search-docs.html',

    '/theme.css',
    '/styles.css',
    '/tool.css',
    '/docs.css',
    '/cyber-edu-tech.css',
    '/cyber-email-scanner.css',
    '/cyber-geo-ip.css',
    '/whats-my-ip.css',
    '/what-web.css',
    '/who-is.css',

    '/theme-boot.js',
    '/theme.js',
    '/main.js',
    '/script.js',
    '/cyber-search.js',
    '/cyber-email-scanner.js',
    '/cyber-geo-ip.js',
    '/whats-my-ip.js',
    '/what-web.js',
    '/who-is.js',

    '/manifest.json',
    '/Images/Project_Cyber-logo.png',
    '/Images/Project%20Cyber%20Vigilan-Teem%20logo.jpg',
    '/Images/icon-maskable-192.png',
    '/Images/icon-maskable-512.png',
    '/Images/url-checker-logo.png',
    '/Images/cyber-search-logo.svg.png',
    '/Images/cyber-edu-tech-logo.png',
    '/Images/email-checker-logo.png',
    '/Images/geo-ip.svg',
    '/Images/whats-my-ip.svg',
    '/Images/what-web.svg',
    '/Images/who-is.svg',
    '/Images/cyber-vTem-logo.png'
].map(scoped);

// 1. Install Event - Cache application architecture assets locally
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // addAll rejects the whole batch if any single asset 404s, which
            // would leave the worker permanently uninstalled. Cache entries
            // individually and tolerate misses instead.
            return Promise.all(
                ASSETS_TO_CACHE.map((asset) =>
                    cache.add(asset).catch((err) => {
                        console.warn('[Service Worker] Skipped asset:', asset, err.message);
                    })
                )
            );
        })
    );
    self.skipWaiting();
});

// 2. Activate Event - Clean up old cache versions safely
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Purging expired cache registry:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            // Take over open tabs immediately, so a version change does not
            // leave clients pinned to a stale shell that references deleted
            // assets (a common source of persistent 404s after a deploy).
            return self.clients.claim();
        })
    );
});

// 3. Fetch Event - Network first for navigations, cache first for static assets
self.addEventListener('fetch', (event) => {
    // Only intercept local UI assets, let backend API requests (POST) bypass cache
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    // Never cache API responses: they are per-request and often token-gated
    if (url.pathname.startsWith('/api/')) return;

    // HTML navigations: serve from cache when offline, fall back to network
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    return response;
                })
                .catch(() => caches.match(event.request).then((cached) =>
                    cached || caches.match(scoped('/index.html'))
                ))
        );
        return;
    }

    // Static assets: cache first, refresh in the background
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((response) => {
                // Opaque and error responses are not worth persisting
                if (response.ok && response.type === 'basic') {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                }
                return response;
            });
        })
    );
});