const CACHE_NAME = 'next-pwa-cache-v2';
const METHODS_TO_IGNORE = ['POST', 'PUT', 'DELETE', 'PATCH'];

self.addEventListener('install', (event) => {
  // Activate immediately, don't wait for old SW to finish
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
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

  const url = new URL(event.request.url);

  // ── NEVER intercept these requests - let them pass through to the network ──

  // API routes
  if (url.pathname.includes('/api/')) return;

  // Next.js internal routes (RSC payloads, chunks, data)
  if (url.pathname.startsWith('/_next/')) return;

  // RSC navigation requests (client-side navigation in App Router)
  if (event.request.headers.get('rsc') === '1') return;
  if (event.request.headers.get('next-router-state-tree')) return;
  if (event.request.headers.get('next-router-prefetch')) return;

  // HTML page navigations (document requests) - let Next.js handle routing
  if (event.request.mode === 'navigate') return;

  // Dashboard routes - never cache these
  if (url.pathname.startsWith('/dashboard')) return;
  if (url.pathname.match(/^\/[^/]+\/dashboard/)) return;

  // Auth routes
  if (url.pathname.startsWith('/login')) return;
  if (url.pathname.startsWith('/auth')) return;

  // ── Only cache static assets (images, fonts, CSS, JS bundles from public/) ──
  const isStaticAsset = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot|css)$/i.test(url.pathname);
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          return caches.match('/offline.html');
        });
      })
  );
});