// Service Worker básico para Izanagi PWA

self.addEventListener('install', event => {
  // Precacheo inicial si se desea
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Limpieza o migración de cachés si es necesario
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Estrategia: red primero, fallback a cache si offline
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
}); 