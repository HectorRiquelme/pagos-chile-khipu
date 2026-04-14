# Khipu Pagos - Sistema de Pagos por Transferencia Bancaria (Mock)

Sistema de simulacion del flujo de pagos por transferencia bancaria estilo Khipu, orientado al contexto chileno. Permite crear cobros en CLP, redirigir al usuario a una pagina mock de seleccion de banco, confirmar la transferencia, recibir un webhook simulado y mostrar el comprobante. Incluye panel admin con filtros y un cron job que expira cobros no pagados despues de 24 horas.

## Stack

- **Backend:** Python 3.10+, FastAPI, SQLAlchemy, SQLite, APScheduler
- **Frontend:** React 18, Vite, TailwindCSS, React Router

## Estructura

```
03_khipu_pagos/
  backend/
    app/
      main.py
      database.py
      models.py
      schemas.py
      crud.py
      scheduler.py
      seed.py
    requirements.txt
  frontend/
    src/
      pages/
      components/
      App.jsx
      main.jsx
      index.css
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
    index.html
```

## Instalacion y ejecucion

### Backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt

# Cargar productos de ejemplo (opcional)
python -m app.seed

# Levantar servidor
uvicorn app.main:app --reload --port 8000
```

El backend quedara disponible en `http://localhost:8000`. La documentacion interactiva de la API en `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend quedara disponible en `http://localhost:5173`.

## Flujo de uso

1. **Catalogo:** el usuario navega al home (`/`), ve productos en CLP y los agrega al carrito.
2. **Pagar con Khipu:** al hacer click en "Pagar con Khipu" se crea un cobro en estado `pendiente` y se redirige a `/khipu/:cobroId`.
3. **Seleccion de banco:** pagina mock que emula el flujo Khipu. El usuario selecciona un banco chileno y confirma.
4. **Webhook:** al confirmar, el frontend dispara el endpoint `/api/webhook/khipu` que marca el cobro como `pagado`.
5. **Comprobante:** se muestra la pagina de comprobante con los datos del pago exitoso.
6. **Panel admin:** en `/admin` se puede ver el listado completo de cobros con filtros por estado y fecha.
7. **Cron de expiracion:** APScheduler corre cada 5 minutos y marca como `expirado` cualquier cobro `pendiente` con mas de 24 horas.

## Estados de cobros

- `pendiente`: cobro creado, esperando confirmacion de transferencia.
- `pagado`: pago confirmado via webhook.
- `expirado`: cobro no pagado dentro de las 24 horas.

## Endpoints principales

- `GET  /api/productos` - Lista de productos disponibles.
- `POST /api/cobros` - Crea un nuevo cobro. Body: `{ "items": [{"producto_id": 1, "cantidad": 2}], "email_pagador": "..." }`.
- `GET  /api/cobros/{id}` - Detalle de un cobro.
- `POST /api/cobros/{id}/confirmar` - Simula la confirmacion del usuario en la pagina del banco (dispara webhook interno).
- `POST /api/webhook/khipu` - Webhook simulado. Body: `{ "cobro_id": 1, "estado": "pagado" }`.
- `GET  /api/admin/cobros?estado=&desde=&hasta=` - Listado admin con filtros.

## Autor

Hector Riquelme (@HectorRiquelme)
