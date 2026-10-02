// Service worker minimal — rend l'app installable et utilisable hors connexion
const CACHE = 'bsv-v9';
const FICHIERS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Ne jamais mettre Firebase en cache : les données doivent rester en direct
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) return;
  if (e.request.method !== 'GET') return;

  // Réseau d'abord, cache en secours si hors connexion
  e.respondWith(
    fetch(e.request)
      .then(rep => {
        if (rep && rep.status === 200 && url.origin === location.origin) {
          const copie = rep.clone();
          caches.open(CACHE).then(c => c.put(e.request, copie));
        }
        return rep;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
