import { useEffect, useState, useCallback } from 'react'
import { formatCLP, formatFecha } from '../utils.js'

export default function Admin() {
  const [cobros, setCobros] = useState([])
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [estado, setEstado] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (estado) params.set('estado', estado)
      if (desde) params.set('desde', new Date(desde).toISOString())
      if (hasta) params.set('hasta', new Date(hasta + 'T23:59:59').toISOString())

      const [cobrosRes, resumenRes] = await Promise.all([
        fetch(`/api/admin/cobros?${params.toString()}`),
        fetch('/api/admin/resumen'),
      ])
      if (!cobrosRes.ok) throw new Error('Error al cargar cobros')
      if (!resumenRes.ok) throw new Error('Error al cargar resumen')
      setCobros(await cobrosRes.json())
      setResumen(await resumenRes.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [estado, desde, hasta])

  useEffect(() => {
    cargar()
  }, [cargar])

  const limpiar = () => {
    setEstado('')
    setDesde('')
    setHasta('')
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800">Panel Admin - Cobros</h1>
      <p className="text-gray-600 mb-6">Gestiona y monitorea los cobros generados.</p>

      {/* Tarjetas de resumen */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Tarjeta titulo="Total cobros" valor={resumen.total} color="bg-gray-100 text-gray-800" />
          <Tarjeta titulo="Pagados" valor={resumen.pagados} color="bg-green-100 text-green-800" />
          <Tarjeta titulo="Pendientes" valor={resumen.pendientes} color="bg-yellow-100 text-yellow-800" />
          <Tarjeta titulo="Expirados" valor={resumen.expirados} color="bg-red-100 text-red-800" />
          <Tarjeta
            titulo="Recaudado"
            valor={formatCLP(resumen.monto_total_pagado_clp)}
            color="bg-khipu-50 text-khipu-700"
          />
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500 uppercase">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="expirado">Expirado</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={cargar} className="flex-1 bg-khipu-600 hover:bg-khipu-700 text-white px-4 py-2 rounded text-sm font-semibold">
              Aplicar
            </button>
            <button onClick={limpiar} className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded text-sm">
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : error ? (
          <div className="p-6 text-red-700">{error}</div>
        ) : cobros.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay cobros que coincidan con los filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Codigo</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Banco</th>
                  <th className="px-4 py-3 text-left">Creado</th>
                  <th className="px-4 py-3 text-left">Pagado</th>
                </tr>
              </thead>
              <tbody>
                {cobros.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{c.codigo}</td>
                    <td className="px-4 py-3">{c.email_pagador || <span className="text-gray-400">-</span>}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCLP(c.monto_clp)}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={c.estado} /></td>
                    <td className="px-4 py-3">{c.banco_seleccionado || <span className="text-gray-400">-</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{formatFecha(c.creado_en)}</td>
                    <td className="px-4 py-3 text-gray-600">{c.pagado_en ? formatFecha(c.pagado_en) : <span className="text-gray-400">-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Tarjeta({ titulo, valor, color }) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <div className="text-xs uppercase opacity-80">{titulo}</div>
      <div className="text-xl font-bold mt-1">{valor}</div>
    </div>
  )
}

function EstadoBadge({ estado }) {
  const styles = {
    pagado: 'bg-green-100 text-green-700',
    pendiente: 'bg-yellow-100 text-yellow-700',
    expirado: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${styles[estado] || 'bg-gray-100 text-gray-700'}`}>
      {estado}
    </span>
  )
}
