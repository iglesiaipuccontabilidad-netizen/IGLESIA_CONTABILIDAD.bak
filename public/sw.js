const CACHE_NAME = 'next-pwa-cache-v1';
const METHODS_TO_IGNORE = ['POST', 'PUT', 'DELETE', 'PATCH'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorar métodos que no deberían cachearse
  if (METHODS_TO_IGNORE.includes(event.request.method)) {
    return;
  }

  // Ignorar solicitudes que no son GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar solicitudes a la API o rutas específicas
  if (event.request.url.includes('/api/') || event.request.url.includes('/_next/data/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devolver del caché si existe
        if (response) {
          return response;
        }

        // Si no está en caché, hacer la solicitud a la red
        return fetch(event.request).then(
          (response) => {
            // No cachear si la respuesta no es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta
            const responseToCache = response.clone();

            // Guardar en caché
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Si falla la solicitud a la red, intentar servir una página de fallback
          return caches.match('/offline.html');
        });
      })
  );
});