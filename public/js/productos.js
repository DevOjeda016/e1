import { api, getUser } from './app.js'

const form = document.querySelector('#form')
const tabla = document.querySelector('#tabla')
const mensaje = document.querySelector('#mensaje')
const vacio = document.querySelector('#vacio')
const titulo = document.querySelector('#titulo-form')
const cancelar = document.querySelector('#cancelar')

let editandoId = null

const celda = (texto) => {
  const td = document.createElement('td')
  td.textContent = texto
  return td
}

const boton = (texto, clase, alHacerClick) => {
  const elemento = document.createElement('button')
  elemento.type = 'button'
  elemento.textContent = texto
  elemento.className = clase
  elemento.addEventListener('click', alHacerClick)
  return elemento
}

const dinero = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const reiniciarForm = () => {
  editandoId = null
  form.reset()
  titulo.textContent = 'Nuevo producto'
  cancelar.hidden = true
}

const editar = (producto) => {
  editandoId = producto.id
  form.nombre.value = producto.nombre
  form.precio.value = producto.precio
  form.stock.value = producto.stock
  titulo.textContent = 'Editar producto'
  cancelar.hidden = false
  form.nombre.focus()
}

const eliminar = async (producto) => {
  if (!confirm(`¿Eliminar "${producto.nombre}"?`)) return
  await ejecutar(async () => {
    await api(`/api/productos/${producto.id}`, { method: 'DELETE' })
    if (editandoId === producto.id) reiniciarForm()
  })
}

const fila = (producto) => {
  const tr = document.createElement('tr')
  const acciones = document.createElement('td')
  acciones.append(
    boton('Editar', '', () => editar(producto)),
    boton('Eliminar', 'peligro', () => eliminar(producto))
  )
  tr.append(celda(producto.nombre), celda(dinero.format(producto.precio)), celda(producto.stock), acciones)
  return tr
}

const cargar = async () => {
  const productos = await api('/api/productos')
  tabla.replaceChildren(...productos.map(fila))
  vacio.hidden = productos.length > 0
}

const ejecutar = async (accion) => {
  mensaje.textContent = ''
  try {
    await accion()
    await cargar()
  } catch (error) {
    mensaje.textContent = error.message
  }
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault()
  const body = Object.fromEntries(new FormData(form))

  await ejecutar(async () => {
    if (editandoId) {
      await api(`/api/productos/${editandoId}`, { method: 'PUT', body })
    } else {
      await api('/api/productos', { method: 'POST', body })
    }
    reiniciarForm()
  })
})

cancelar.addEventListener('click', reiniciarForm)

const iniciar = async () => {
  try {
    const user = await getUser()
    if (!user) return location.replace('/login.html')
    await cargar()
  } catch (error) {
    mensaje.textContent = error.message
  }
}

iniciar()
