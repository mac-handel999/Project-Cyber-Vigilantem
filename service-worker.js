const CACHE_NAME = 'vigilanteam-v1';
const ASSETS_TO_CACHE = [
    '/index.html',
    '/styles.css',
    '/main.js',
    '/project.html',
    '/cyber-search-docs.html',
];

// 1. Install Event - Cache application architecture assets locally
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Pre-caching asset tree core');
            return cache.addAll(ASSETS_TO_CACHE);
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
        })
    );
    self.clients.claim();
});

// 3. Fetch Event - Serve assets instantly from cache when offline
self.addEventListener('fetch', (event) => {
    // Only intercept local UI assets, let backend API requests (POST) bypass cache
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});