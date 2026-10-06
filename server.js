import express from 'express'
import { join } from 'node:path'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { db } from './db.js'

const PORT = process.env.PORT ?? 3000
const SEMANA = 7 * 24 * 60 * 60 * 1000
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME = /^[a-z0-9_]{3,20}$/

const app = express()
app.use(express.json())
app.use(express.static(join(import.meta.dirname, 'public')))

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '')
const fallo = (res, estado, error) => res.status(estado).json({ error })
const publico = ({ id, nombre, correo, username }) => ({ id, nombre, correo, username })

const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

const verificarPassword = (password, guardado) => {
  const [salt, hash] = guardado.split(':')
  return timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(password, salt, 64))
}

const tokenDe = (req) =>
  req.headers.cookie
    ?.split('; ')
    .find((cookie) => cookie.startsWith('sid='))
    ?.slice(4)

const crearSesion = (res, userId) => {
  const token = randomBytes(32).toString('hex')
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId)
  res.cookie('sid', token, { httpOnly: true, sameSite: 'lax', maxAge: SEMANA })
}

const auth = (req, res, next) => {
  const user = db
    .prepare(
      `SELECT users.id, users.nombre, users.correo, users.username
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ?`
    )
    .get(tokenDe(req) ?? '')
  if (!user) return fallo(res, 401, 'No has iniciado sesión')
  req.user = user
  next()
}

app.post('/api/registro', (req, res) => {
  const { password } = req.body ?? {}
  const nombre = texto(req.body?.nombre)
  const correo = texto(req.body?.correo).toLowerCase()
  const username = texto(req.body?.username).toLowerCase()

  if (!nombre) return fallo(res, 400, 'El nombre es obligatorio')
  if (!EMAIL.test(correo)) return fallo(res, 400, 'El correo no es válido')
  if (!USERNAME.test(username)) {
    return fallo(res, 400, 'El username debe tener de 3 a 20 letras, números o guion bajo')
  }
  if (typeof password !== 'string' || password.length < 6) {
    return fallo(res, 400, 'La contraseña debe tener al menos 6 caracteres')
  }

  const existe = db.prepare('SELECT 1 FROM users WHERE correo = ? OR username = ?').get(correo, username)
  if (existe) return fallo(res, 409, 'El correo o el username ya están registrados')

  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (nombre, correo, username, password) VALUES (?, ?, ?, ?)')
    .run(nombre, correo, username, hashPassword(password))

  crearSesion(res, lastInsertRowid)
  res.status(201).json(publico({ id: lastInsertRowid, nombre, correo, username }))
})

app.post('/api/login', (req, res) => {
  const identificador = texto(req.body?.identificador).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  const user = db
    .prepare('SELECT * FROM users WHERE correo = ? OR username = ?')
    .get(identificador, identificador)

  if (!user || !verificarPassword(password, user.password)) {
    return fallo(res, 401, 'Credenciales incorrectas')
  }

  crearSesion(res, user.id)
  res.json(publico(user))
})

app.post('/api/logout', (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(tokenDe(req) ?? '')
  res.clearCookie('sid').json({ ok: true })
})

app.get('/api/me', auth, (req, res) => res.json(req.user))

const leerProducto = (cuerpo = {}) => {
  const nombre = texto(cuerpo.nombre)
  const precio = Number(cuerpo.precio)
  const stock = Number(cuerpo.stock)
  const valido = nombre && Number.isFinite(precio) && precio >= 0 && Number.isInteger(stock) && stock >= 0
  return valido ? { nombre, precio, stock } : null
}

app.use('/api/productos', auth)

app.get('/api/productos', (req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY id DESC').all())
})

app.post('/api/productos', (req, res) => {
  const producto = leerProducto(req.body)
  if (!producto) return fallo(res, 400, 'Revisa nombre, precio y stock')

  const { lastInsertRowid } = db
    .prepare('INSERT INTO products (nombre, precio, stock) VALUES (?, ?, ?)')
    .run(producto.nombre, producto.precio, producto.stock)

  res.status(201).json({ id: lastInsertRowid, ...producto })
})

app.put('/api/productos/:id', (req, res) => {
  const producto = leerProducto(req.body)
  if (!producto) return fallo(res, 400, 'Revisa nombre, precio y stock')

  const { changes } = db
    .prepare('UPDATE products SET nombre = ?, precio = ?, stock = ? WHERE id = ?')
    .run(producto.nombre, producto.precio, producto.stock, req.params.id)

  if (!changes) return fallo(res, 404, 'Producto no encontrado')
  res.json({ id: Number(req.params.id), ...producto })
})

app.delete('/api/productos/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  if (!changes) return fallo(res, 404, 'Producto no encontrado')
  res.json({ ok: true })
})

app.listen(PORT, () => console.log(`App lista en http://localhost:${PORT}`))
