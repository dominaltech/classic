// CLASSIC STOREFRONT SERVICE WORKER (V9 - FAST AUTO SLIDER SPEED 1.5S)
const STATIC_CACHE_NAME = 'classic-storefront-v10';
const MEDIA_CACHE_NAME = 'classic-media-v4';

const STATIC_ASSETS = [
  '/',
  'index.html',
  'shop.html',
  'styles.css',
  'main.js',
  'config.js',
  'manifest.json',
  'images/logo.png',
  'classic.mp4'
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

  // 1. REAL-TIME REST / GRAPHQL CALLS - DIRECT NETWORK
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. SUPABASE STORAGE ASSETS (HERO BANNERS, CATEGORIES & PRODUCT IMAGES) - CACHE-FIRST
  // Returning visitors consume ZERO BYTES of Supabase storage egress.
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/')) {
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse; // 0 Supabase egress bytes!
        }
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return caches.match('images/logo.png');
        }
      })
    );
    return;
  }

  // 3. LOCAL MEDIA & VIDEO (classic.mp4, webp, png, svg) - CACHE-FIRST
  const isMediaAsset = event.request.destination === 'image' || 
    event.request.destination === 'video' ||
    url.pathname.match(/\.(webp|jpg|jpeg|png|gif|svg|avif|mp4|webm)$/i);

  if (isMediaAsset) {
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse; // Local cache hit
        }
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return cachedResponse;
        }
      })
    );
    return;
  }

  // 4. LIVE HTML PAGES, CSS & SCRIPTS - NETWORK-FIRST
  // Guarantees users always receive fresh code and design updates immediately
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
      .catch(() => caches.match(event.request))
  );
});
