self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('cs-linkguard-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/signup/signup.html',
        '/ScannerDash/ScannerDash.html',
        '/manifest.json',
        '/theme.css',
        '/signup/signup.css',
        '/ScannerDash/ScannerDash.css'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
