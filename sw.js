// NAI Significa Ogled — Service Worker
// Verzija — povečaj ob spremembah kode da brskalnik osveži cache
const CACHE_VERSION = 'nai-ogled-v3';
const CACHE_FILES = [
  './',
  './index.html'
];

// Install: shrani datoteke v cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate: počisti stare verzije cache-a
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: vrni iz cache-a, če ni internetne povezave
self.addEventListener('fetch', event => {
  // Le GET zahteve
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    // Najprej poskusi mrežo (network-first za sveže verzije)
    fetch(event.request)
      .then(response => {
        // Če uspeh, shrani v cache za prihodnjo offline uporabo
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Mreža ni dosegljiva — uporabi cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          // Če zahteva ni v cache, vrni index.html (SPA fallback)
          return caches.match('./index.html');
        });
      })
  );
});
