const CACHE_NAME = 'kalifit-cache-v1';
const urlsToCache = [
    'index.html',
    'assets/styles/style_index.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    // Aggiungi qui altre risorse che vuoi memorizzare in cache
];

// Installazione del Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Attivazione del Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Recupero delle risorse
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se c'è una corrispondenza nella cache, restituiscila; altrimenti, fetch from network
                return response || fetch(event.request);
            })
    );
});