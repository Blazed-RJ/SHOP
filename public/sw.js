const CACHE_NAME = 'neevbill-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/inventory',
  '/invoices',
  '/pos',
  '/customers',
];

// Install: pre-cache key routes
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {/* ignore failures on install */});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Network-first for API, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, and websocket requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // API routes: network-first (stale if offline)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline — data unavailable', offline: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      )
    );
    return;
  }

  // Navigation & static: cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && (url.pathname.startsWith('/_next/') || STATIC_ASSETS.includes(url.pathname))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback HTML
        return new Response(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline — Neevbill</title><style>body{background:#09090b;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}.card{background:#1a1920;border:1px solid #2a2836;padding:2rem;border-radius:1rem;max-width:300px}.emoji{font-size:3rem;margin-bottom:1rem}h1{color:#f59e0b;font-size:1.25rem;margin:0 0 .5rem}p{color:#8a8695;font-size:.875rem;margin:0}</style></head><body><div class="card"><div class="emoji">📶</div><h1>You're Offline</h1><p>Connect to the internet and refresh to sync your data.</p></div></body></html>`,
          { headers: { 'Content-Type': 'text/html' }, status: 200 }
        );
      });
    })
  );
});
