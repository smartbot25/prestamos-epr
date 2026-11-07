const CACHE = 'mis-prestamos-v1';
const FILES = ['./', 'index.html', 'manifest.json',
  'css/variables.css', 'css/styles.css', 'css/components.css', 'css/responsive.css',
  'js/utils.js', 'js/database.js', 'js/clients.js', 'js/loans.js', 'js/backup.js', 'js/app.js',
  'assets/icons/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match('index.html'))));
});
