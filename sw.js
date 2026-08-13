const CACHE_NAME = 'pumto-static-v3';
const IMAGE_CACHE_NAME = 'pumto-images-v1';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/intro.html',
  '/intro-blue.html',
  '/intro-orange.html',
  '/intro-green.html',
  '/login.html',
  '/home.html',
  '/growth.html',
  '/mypage.html',
  '/save.html',
  '/save-academy.html',
  '/intro_final.css',
  '/intro-blue.css',
  '/intro-orange.css',
  '/intro-green.css',
  '/login.css',
  '/home.css',
  '/growth.css',
  '/mypage.css',
  '/save.css',
  '/save-academy.css',
  '/pwa-loader.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key !== IMAGE_CACHE_NAME) {
            return caches.delete(key);
          }
          return undefined;
        })
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.includes('/PUMTO.img/') || event.request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;

          return fetch(event.request).then(networkResponse => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then(networkResponse => {
      if (networkResponse.status === 200) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
      }
      return networkResponse;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
