// Research Journal service worker
// Strategy: network-first for same-origin app files (updates always win when online),
// cache-first for cross-origin CDN libraries (D3, SheetJS, KaTeX, fonts, docx) so the
// app keeps working fully offline once each library has been fetched once.
const APP_CACHE = 'rj-app-v1';
const CDN_CACHE = 'rj-cdn-v1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.origin === location.origin) {
    // App files: network-first, cached copy as offline fallback
    e.respondWith(
      fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(APP_CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // CDN libraries & fonts: cache-first (immutable versioned URLs)
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CDN_CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return resp;
      }))
    );
  }
});
