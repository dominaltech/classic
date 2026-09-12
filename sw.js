// CLASSIC STOREFRONT SERVICE WORKER (V8 - SQUARE SLIDER & MOBILE LAYOUT OPTIMIZATIONS)
const STATIC_CACHE_NAME = 'classic-storefront-v8';
const MEDIA_CACHE_NAME = 'classic-media-v3';

const STATIC_ASSETS = [
  '/',
  'index.html',
  'shop.html',
  'styles.css',
  'main.js',
  'config.js',
  'manifest.json',
  'images/logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => console.log('SW install cache bypass:', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== STATIC_CACHE_NAME && cache !== MEDIA_CACHE_NAME) {
            console.log('Purging stale storefront cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 1. NEVER CACHE SUPABASE REST API CALLS - ALWAYS FETCH REAL-TIME DATA
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. SUPABASE STORAGE ASSETS (HERO BANNERS & PRODUCT IMAGES) - NETWORK-FIRST
  // Guarantees immediate visibility of uploaded/edited banners while preserving offline fallback
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(MEDIA_CACHE_NAME).then((mediaCache) => {
              mediaCache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || caches.match('images/logo.png'));
        })
    );
    return;
  }

  // 3. LOCAL IMAGES & MEDIA - NETWORK-FIRST WITH MEDIA CACHE FALLBACK
  const isLocalImage = event.request.destination === 'image' || 
    url.pathname.match(/\.(webp|jpg|jpeg|png|gif|svg|avif)$/i);

  if (isLocalImage) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(MEDIA_CACHE_NAME).then((mediaCache) => {
              mediaCache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. LIVE HTML PAGES & SCRIPTS - NETWORK-FIRST
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
