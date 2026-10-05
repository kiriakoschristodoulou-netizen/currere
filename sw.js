/* Currere service worker.
   Pages are fetched from the network first, so players always get the latest version
   when they are online; the cached copy is used only when the network is unavailable. */
const VERSION = 'currere-1.3.0';
const ASSETS = ['./', './index.html', './banner.png', './icon-192.png', './icon-512.png', './favicon.svg', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isPage) {
    /* Network first for the game page */
    e.respondWith(fetch(req).then(resp => {
      if (resp.ok) { const c = resp.clone(); caches.open(VERSION).then(cache => cache.put(req, c)); }
      return resp;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  /* Cache first for images, icons and fonts */
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => {
    if (resp.ok && (url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com'))) {
      const c = resp.clone(); caches.open(VERSION).then(cache => cache.put(req, c));
    }
    return resp;
  })));
});
