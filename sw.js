const CACHE = 'meal-planner-v4';
const ASSETS = [
  '/', '/index.html', '/manifest.json',
  '/css/app.css',
  '/js/firebase-config.js',
  '/js/constants.js', '/js/icons.js', '/js/db.js',
  '/js/utils.js', '/js/recipes.js', '/js/planner.js',
  '/js/shopping.js', '/js/pantry.js', '/js/backup.js',
  '/js/sync.js', '/js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  /* Firebase та Google API — завжди з мережі */
  if (url.includes('googleapis.com') || url.includes('firebaseio.com') ||
      url.includes('gstatic.com') || url.includes('firebaseapp.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
