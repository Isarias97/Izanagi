// Service Worker Profesional para Sistema Izanagi PWA
const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `izanagi-cache-${CACHE_VERSION}`;
const STATIC_CACHE = 'izanagi-static-v2';
const DYNAMIC_CACHE = 'izanagi-dynamic-v2';
const API_CACHE = 'izanagi-api-v2';

// URLs críticas para precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.css',
  '/index.tsx',
  '/App.tsx',
  '/favicon.ico',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-192.png',
  '/icon-384.png',
  '/icon-512.png',
  '/icon-maskable.png'
];

// Estrategias de cache
const CACHE_STRATEGIES = {
  STATIC: 'cache-first',
  DYNAMIC: 'stale-while-revalidate',
  API: 'network-first',
  IMAGES: 'cache-first'
};

// Configuración de expiración
const CACHE_EXPIRATION = {
  STATIC: 60 * 60 * 24 * 30, // 30 días
  DYNAMIC: 60 * 60 * 24 * 7,  // 7 días
  API: 60 * 60 * 24,          // 1 día
  IMAGES: 60 * 60 * 24 * 30   // 30 días
};

// Función para limpiar caches antiguos
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  return Promise.all(
    cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => {
        console.log('Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      })
  );
}

// Función para cachear recursos
async function cacheResources(cacheName, urls) {
  const cache = await caches.open(cacheName);
  const results = await Promise.allSettled(
    urls.map(url => cache.add(url).catch(err => {
      console.warn('Failed to cache:', url, err);
      return null;
    }))
  );
  
  const successful = results.filter(result => result.status === 'fulfilled').length;
  console.log(`Cached ${successful}/${urls.length} resources in ${cacheName}`);
}

// Función para obtener respuesta del cache
async function getCachedResponse(request) {
  const cacheNames = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const response = await cache.match(request);
    if (response) {
      return response;
    }
  }
  
  return null;
}

// Función para cachear respuesta
async function cacheResponse(request, response, cacheName) {
  if (response && response.status === 200) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
}

// Función para determinar estrategia de cache
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // APIs
  if (url.pathname.startsWith('/api/')) {
    return { strategy: CACHE_STRATEGIES.API, cacheName: API_CACHE };
  }
  
  // Imágenes
  if (/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname)) {
    return { strategy: CACHE_STRATEGIES.IMAGES, cacheName: STATIC_CACHE };
  }
  
  // Recursos estáticos
  if (/\.(js|css|html|json|webmanifest)$/i.test(url.pathname)) {
    return { strategy: CACHE_STRATEGIES.STATIC, cacheName: STATIC_CACHE };
  }
  
  // Contenido dinámico
  return { strategy: CACHE_STRATEGIES.DYNAMIC, cacheName: DYNAMIC_CACHE };
}

// Evento de instalación
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Precachear recursos críticos
      cacheResources(STATIC_CACHE, PRECACHE_URLS),
      // Limpiar caches antiguos
      cleanOldCaches()
    ]).then(() => {
      console.log('Service Worker installed successfully');
      self.skipWaiting();
    })
  );
});

// Evento de activación
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      cleanOldCaches(),
      // Tomar control inmediatamente
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated successfully');
    })
  );
});

// Evento de fetch
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Solo manejar requests GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar requests de chrome-extension
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  const { strategy, cacheName } = getCacheStrategy(request);
  
  event.respondWith(
    (async () => {
      try {
        let response;
        
        switch (strategy) {
          case CACHE_STRATEGIES.STATIC:
            // Cache First para recursos estáticos
            response = await getCachedResponse(request);
            if (response) {
              return response;
            }
            
            response = await fetch(request);
            await cacheResponse(request, response, cacheName);
            return response;
            
          case CACHE_STRATEGIES.DYNAMIC:
            // Stale While Revalidate para contenido dinámico
            const cachedResponse = await getCachedResponse(request);
            
            const fetchPromise = fetch(request).then(response => {
              cacheResponse(request, response, cacheName);
              return response;
            });
            
            return cachedResponse || fetchPromise;
            
          case CACHE_STRATEGIES.API:
            // Network First para APIs
            try {
              response = await fetch(request);
              await cacheResponse(request, response, cacheName);
              return response;
            } catch (error) {
              console.log('Network failed, trying cache for API:', request.url);
              const cachedResponse = await getCachedResponse(request);
              if (cachedResponse) {
                return cachedResponse;
              }
              throw error;
            }
            
          case CACHE_STRATEGIES.IMAGES:
            // Cache First para imágenes
            response = await getCachedResponse(request);
            if (response) {
              return response;
            }
            
            response = await fetch(request);
            await cacheResponse(request, response, cacheName);
            return response;
            
          default:
            return fetch(request);
        }
      } catch (error) {
        console.error('Fetch failed:', error);
        
        // Fallback para páginas HTML
        if (request.destination === 'document') {
          const cachedResponse = await getCachedResponse(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Fallback a la página principal
          return caches.match('/index.html');
        }
        
        throw error;
      }
    })()
  );
});

// Evento de mensaje para comunicación con la app
self.addEventListener('message', event => {
  const { data } = event;
  
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
      
    case 'CLEAR_CACHE':
      cleanOldCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'GET_CACHE_INFO':
      caches.keys().then(cacheNames => {
        event.ports[0].postMessage({ 
          cacheNames,
          version: CACHE_VERSION 
        });
      });
      break;
  }
});

// Evento de sync en background (para funcionalidad offline)
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'izanagi-background-sync') {
    event.waitUntil(
      // Aquí puedes agregar lógica para sincronizar datos offline
      Promise.resolve()
    );
  }
});

// Evento de push (para notificaciones)
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación del Sistema Izanagi',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sistema Izanagi', options)
  );
});

// Evento de click en notificación
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Manejo de errores global
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
}); 