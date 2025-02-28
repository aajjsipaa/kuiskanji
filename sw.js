
const CACHE_NAME = 'kanji-quiz-v1.3';

// Dapatkan base path untuk kompatibilitas GitHub Pages
const getBasePath = () => {
  const path = location.pathname;
  // Deteksi apakah berjalan di GitHub Pages
  if (location.hostname.includes('github.io')) {
    // Ekstrak nama repositori dari path
    const parts = path.split('/');
    if (parts.length > 1) {
      return '/' + parts[1]; // Mengembalikan nama repo sebagai base path
    }
  }
  return ''; // Default empty base path untuk hosting lainnya
};

const BASE_PATH = getBasePath();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          BASE_PATH + '/',
          BASE_PATH + '/index.html',
          BASE_PATH + '/style.css',
          BASE_PATH + '/script.js',
          BASE_PATH + '/kanji_n5.json',
          BASE_PATH + '/favicon.svg',
          BASE_PATH + '/manifest.json'
        ]);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
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
