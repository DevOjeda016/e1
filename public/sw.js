const APP_CACHE = 'app-v1'
const API_CACHE = 'api'
const TIEMPO_MAXIMO = 5000

const ARCHIVOS = [
  '/',
  '/index.html',
  '/login.html',
  '/registro.html',
  '/productos.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/login.js',
  '/js/registro.js',
  '/js/productos.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

const redPrimero = async (request, nombreCache) => {
  const cache = await caches.open(nombreCache)

  try {
    const respuesta = await fetch(request, { signal: AbortSignal.timeout(TIEMPO_MAXIMO) })
    if (respuesta.ok) cache.put(request, respuesta.clone())
    return respuesta
  } catch {
    const guardada = await cache.match(request, { ignoreSearch: true })
    if (guardada) return guardada

    if (request.mode === 'navigate') {
      const inicio = await caches.match('/index.html')
      if (inicio) return inicio
    }

    return Response.json({ error: 'Sin conexión' }, { status: 503 })
  }
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(ARCHIVOS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres.filter((nombre) => ![APP_CACHE, API_CACHE].includes(nombre)).map((nombre) => caches.delete(nombre))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (evento) => {
  const { request } = evento
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== location.origin) return

  const nombreCache = url.pathname.startsWith('/api/') ? API_CACHE : APP_CACHE
  evento.respondWith(redPrimero(request, nombreCache))
})
