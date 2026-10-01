/* Service worker: keeps the app usable with no network, without ever pinning
   an old build. Network first, cache only as a fallback, so a phone that has
   been offline for a week still picks up the new version on its next launch.
   Bump CACHE when the shell changes; the old cache is dropped on activate. */

var CACHE = 'zaiko-v3';
var ASSETS = [
  './',
  './app-zaiko.html',
  './manifest.json',
  './icon-180.png',
  './icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.map(function(k){
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  if (e.request.url.indexOf('http') !== 0) return;   // leave blob:/data: alone

  e.respondWith(
    fetch(e.request).then(function(res){
      if (res && res.status === 200 && res.type === 'basic'){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      }
      return res;
    }).catch(function(){
      // offline: serve what we cached, and for a navigation fall back to the shell
      return caches.match(e.request).then(function(hit){
        return hit || caches.match('./app-zaiko.html');
      });
    })
  );
});
