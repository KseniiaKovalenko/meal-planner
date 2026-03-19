const CACHE = 'meal-planner-v2';
const ASSETS = [
  '/', '/index.html', '/manifest.json',
  '/css/app.css',
  '/js/constants.js', '/js/icons.js', '/js/db.js',
  '/js/utils.js', '/js/recipes.js', '/js/planner.js',
  '/js/shopping.js', '/js/pantry.js', '/js/backup.js',
  '/js/app.js'
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
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
