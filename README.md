# Panadería La Espiga

App web sencilla para administrar los productos de una panadería. Incluye registro, login/logout, CRUD de productos y funciona sin internet gracias a un service worker.

## Requisitos

- Node.js 22.13 o superior (descárgalo en https://nodejs.org, versión LTS)

Revisa tu versión con `node -v`. Si es menor, `npm start` se detiene y muestra `Unsupported engine`: actualiza Node y vuelve a correrlo.

## Cómo correrla

```
npm start
```

Esto instala las dependencias y levanta el servidor. Abre http://localhost:3000.

Para usar otro puerto:

```
PORT=4000 npm start
```

## Cómo usarla

1. Crea una cuenta en **Registro** (nombre, correo, username y contraseña).
2. Inicia sesión con tu correo o tu username.
3. En **Productos** agrega, edita o elimina productos.

## Probar el modo sin internet

1. Inicia sesión y entra a **Productos** al menos una vez con internet.
2. En DevTools → Network activa **Offline** y recarga la página.
3. Seguirás viendo la app y tu lista de productos. Guardar o eliminar mostrará "Sin conexión".

## Estructura

- `server.js`: servidor Express y API
- `db.js`: base de datos SQLite (se crea sola en `app.db`)
- `public/`: páginas, estilos, scripts, `sw.js` (service worker), `manifest.json` e íconos

## Instalarla como app

Con la app abierta en Chrome o Edge, usa el botón de instalar en la barra de direcciones (o menú → "Instalar La Espiga").
