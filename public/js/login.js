import { api, limpiarCache } from './app.js'

const form = document.querySelector('#form')
const mensaje = document.querySelector('#mensaje')

form.addEventListener('submit', async (evento) => {
  evento.preventDefault()
  mensaje.textContent = ''

  try {
    await api('/api/login', { method: 'POST', body: Object.fromEntries(new FormData(form)) })
    await limpiarCache()
    location.href = '/productos.html'
  } catch (error) {
    mensaje.textContent = error.message
  }
})
