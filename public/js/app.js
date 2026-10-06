const API_CACHE = 'api'

export const api = async (url, { method = 'GET', body } = {}) => {
  const respuesta = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body)
  }).catch(() => {
    throw new Error('Sin conexión')
  })

  const datos = await respuesta.json().catch(() => ({}))

  if (!respuesta.ok) {
    throw Object.assign(new Error(datos.error ?? 'Error inesperado'), { status: respuesta.status })
  }

  return datos
}

export const getUser = async () => {
  try {
    return await api('/api/me')
  } catch (error) {
    if (error.status === 401) return null
    throw error
  }
}

export const limpiarCache = async () => {
  await globalThis.caches?.delete(API_CACHE)
}

const mostrarNav = (user) => {
  document.querySelectorAll('[data-auth]').forEach((elemento) => {
    elemento.hidden = (elemento.dataset.auth === 'in') !== Boolean(user)
  })
  if (user) document.querySelector('#saludo').textContent = `Hola, ${user.nombre}`
}

const actualizarConexion = () => {
  document.body.classList.toggle('offline', !navigator.onLine)
}

document.querySelector('#salir').addEventListener('click', async () => {
  try {
    await api('/api/logout', { method: 'POST' })
    await limpiarCache()
    location.href = '/'
  } catch (error) {
    alert(error.message)
  }
})

addEventListener('online', actualizarConexion)
addEventListener('offline', actualizarConexion)
actualizarConexion()

getUser().then(mostrarNav).catch(() => mostrarNav(null))

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
