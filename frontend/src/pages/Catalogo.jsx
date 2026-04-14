import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCLP } from '../utils.js'

export default function Catalogo() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState({}) // { producto_id: cantidad }
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/productos')
      .then((r) => {
        if (!r.ok) throw new Error('No se pudieron cargar productos')
        return r.json()
      })
      .then((data) => setProductos(data))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  const agregar = (p) => {
    setCarrito((prev) => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))
  }
  const quitar = (p) => {
    setCarrito((prev) => {
      const cantidad = (prev[p.id] || 0) - 1
      const next = { ...prev }
      if (cantidad <= 0) delete next[p.id]
      else next[p.id] = cantidad
      return next
    })
  }

  const items = productos
    .filter((p) => carrito[p.id])
    .map((p) => ({ ...p, cantidad: carrito[p.id] }))
  const total = items.reduce((acc, it) => acc + it.precio_clp * it.cantidad, 0)

  const pagarConKhipu = async () => {
    if (items.length === 0) return
    setProcesando(true)
    setError(null)
    try {
      const res = await fetch('/api/cobros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_pagador: email,
          items: items.map((i) => ({ producto_id: i.id, cantidad: i.cantidad })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'No se pudo crear el cobro')
      }
      const cobro = await res.json()
      navigate(`/khipu/${cobro.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setProcesando(false)
    }
  }

  if (cargando) {
    return <div className="max-w-6xl mx-auto p-8 text-gray-600">Cargando productos...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Productos chilenos</h1>
      <p className="text-gray-600 mb-6">Agrega productos al carrito y paga de forma segura con transferencia bancaria.</p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
          {productos.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
              <div className="h-40 bg-gradient-to-br from-khipu-50 to-khipu-100 flex items-center justify-center text-khipu-700 font-semibold text-center px-3">
                {p.nombre}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-800">{p.nombre}</h3>
                <p className="text-sm text-gray-500 mt-1 flex-1">{p.descripcion}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-khipu-700">{formatCLP(p.precio_clp)}</span>
                  <div className="flex items-center gap-2">
                    {carrito[p.id] ? (
                      <>
                        <button onClick={() => quitar(p)} className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">-</button>
                        <span className="w-5 text-center">{carrito[p.id]}</span>
                        <button onClick={() => agregar(p)} className="w-8 h-8 rounded bg-khipu-600 hover:bg-khipu-700 text-white font-bold">+</button>
                      </>
                    ) : (
                      <button onClick={() => agregar(p)} className="px-3 py-1.5 text-sm rounded bg-khipu-600 hover:bg-khipu-700 text-white font-semibold">
                        Agregar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="bg-white rounded-xl border border-gray-200 p-5 h-fit sticky top-4">
          <h2 className="font-bold text-gray-800 mb-3">Tu carrito</h2>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">Aun no agregas productos.</p>
          ) : (
            <ul className="divide-y">
              {items.map((it) => (
                <li key={it.id} className="py-2 flex justify-between text-sm">
                  <span className="text-gray-700">{it.nombre} x{it.cantidad}</span>
                  <span className="font-medium">{formatCLP(it.precio_clp * it.cantidad)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 pt-3 border-t flex justify-between items-center">
            <span className="text-gray-600">Total</span>
            <span className="text-xl font-bold text-gray-900">{formatCLP(total)}</span>
          </div>

          <div className="mt-4">
            <label className="text-xs text-gray-500 uppercase">Email (opcional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.cl"
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-khipu-500"
            />
          </div>

          <button
            disabled={items.length === 0 || procesando}
            onClick={pagarConKhipu}
            className="mt-4 w-full bg-khipu-600 hover:bg-khipu-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition"
          >
            {procesando ? 'Generando cobro...' : 'Pagar con Khipu'}
          </button>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Pago seguro vía transferencia bancaria
          </p>
        </aside>
      </div>
    </div>
  )
}
