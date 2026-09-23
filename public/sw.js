/* Tool Hub service worker.
 *
 * - Precaches the app shell (home page, logo, manifest, icons, scripts).
 * - Network-first for page navigations → fresh HTML when online,
 *   falls back to cache (then home) when offline.
 * - Stale-while-revalidate for static assets and CDNs
 *   (Tailwind browser build, Google Fonts) → offline styling works.
 * - NEVER caches API calls: same-origin /api/* and the attendance
 *   API origin always go straight to the network.
 *
 * Bump VERSION to invalidate all caches on deploy. */

const VERSION = 'v1';
const CACHE_NAME = `toolhub-${VERSION}`;

const PRECACHE_URLS = [
    '/',
    '/manifest.webmanifest',
    '/assets/index.svg',
    '/assets/attendance.js',
    '/assets/pwa.js',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png',
    '/assets/icons/icon-512-maskable.png',
    '/assets/icons/apple-touch-icon.png',
];

// Origins that must always hit the network (live APIs, never cached).
const NETWORK_ONLY_ORIGINS = [
    'https://tool-8s0g.onrender.com',
];

// Third-party origins worth caching so the app works offline.
const RUNTIME_CACHE_ORIGINS = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdn.jsdelivr.net',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Non-GET (POST/PUT/...) always goes to the network untouched.
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // API endpoints: passthrough, never cached.
    if (url.pathname.startsWith('/api/')) return;
    if (NETWORK_ONLY_ORIGINS.includes(url.origin)) return;

    const isSameOrigin = url.origin === self.location.origin;
    if (!isSameOrigin && !RUNTIME_CACHE_ORIGINS.includes(url.origin)) return;

    if (request.mode === 'navigate') {
        event.respondWith(handleNavigation(event, request));
        return;
    }

    event.respondWith(handleAsset(event, request));
});

async function handleNavigation(event, request) {
    try {
        const response = await fetch(request);

        if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            const putDone = cache.put(request, response.clone());
            event.waitUntil(putDone.catch(() => undefined));
        }

        return response;
    } catch (error) {
        // Offline: serve the cached page, or fall back to the cached home.
        const cache = await caches.open(CACHE_NAME);
        const cached = (await cache.match(request)) || (await cache.match('/'));

        if (cached) return cached;

        return new Response('Ngoại tuyến — trang này chưa được lưu.', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }
}

async function handleAsset(event, request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    // Refresh in the background regardless of the cache hit/miss.
    const refresh = fetch(request)
        .then((response) => {
            if (response && (response.ok || response.type === 'opaque')) {
                return cache.put(request, response.clone());
            }
            return undefined;
        })
        .catch(() => undefined);

    event.waitUntil(refresh);

    if (cached) return cached;

    const response = await fetch(request).catch(() => null);
    if (response) return response;

    return Response.error();
}
