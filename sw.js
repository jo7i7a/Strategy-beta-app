// ===== SERVICE WORKER — CColoColo =====
const CACHE_NAME = 'ccolocolo-v1';
const ASSETS = [
  './',
  './index.html',
  './assets/teams/colocolo.png',
];

// Instalar — cachear assets principales
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

// Activar — limpiar caches viejos
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

// Fetch — cache first para assets, network first para el HTML
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  
  // Solo interceptar requests del mismo origen
  if(url.origin !== location.origin) return;

  // HTML — network first, fallback a cache
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request)
        .then(res=>{
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(e.request, clone));
          return res;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  // Imágenes/assets — cache first
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(res=>{
        if(res.ok){
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(e.request, clone));
        }
        return res;
      }).catch(()=>cached);
    })
  );
});
