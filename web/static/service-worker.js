const CACHE = 'vaxtrack-v1'

self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['/', '/manifest.json', '/icon.svg']))
      .then(() => self.skipWaiting())
  )
)

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
)

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return

  // ponytail: navigation requests go network-first so a redeploy's new hashed
  // asset names aren't shadowed by a stale cached index.html; hashed assets
  // (immutable filenames) stay cache-first below.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()))
          return resp
        })
        .catch(() => caches.match(e.request))
    )
    return
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(resp => {
        if (resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp.clone()))
        return resp
      })
    })
  )
})
