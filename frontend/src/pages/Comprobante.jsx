import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatCLP, formatFecha } from '../utils.js'

export default function Comprobante() {
  const { cobroId } = useParams()
  const [cobro, setCobro] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch(`/api/cobros/${cobroId}`)
      .then((r) => {
        if (!r.ok) throw new Error('No se encontro el comprobante')
        return r.json()
      })
      .then(setCobro)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [cobroId])

  if (cargando) return <div className="max-w-xl mx-auto p-8 text-gray-600">Cargando comprobante...</div>
  if (error) return <div className="max-w-xl mx-auto p-8 text-red-700">{error}</div>
  if (!cobro) return null

  const pagado = cobro.estado === 'pagado'

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className={`p-6 ${pagado ? 'bg-green-50 border-b border-green-200' : 'bg-yellow-50 border-b border-yellow-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-3xl ${pagado ? 'bg-green-500' : 'bg-yellow-500'}`}>
              {pagado ? '✓' : '!'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {pagado ? 'Pago exitoso' : `Estado: ${cobro.estado}`}
              </h1>
              <p className="text-sm text-gray-600">
                {pagado
                  ? 'Tu transferencia fue confirmada correctamente.'
                  : 'Este cobro aun no esta pagado.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Codigo de cobro" valor={<span className="font-mono">{cobro.codigo}</span>} />
            <Info label="Estado" valor={<EstadoBadge estado={cobro.estado} />} />
            <Info label="Monto" valor={<span className="font-bold text-khipu-700">{formatCLP(cobro.monto_clp)}</span>} />
            <Info label="Banco" valor={cobro.banco_seleccionado || '-'} />
            <Info label="Email pagador" valor={cobro.email_pagador || '-'} />
            <Info label="Creado" valor={formatFecha(cobro.creado_en)} />
            {cobro.pagado_en && <Info label="Pagado" valor={formatFecha(cobro.pagado_en)} />}
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-gray-800 mb-2">Detalle</h3>
            <ul className="divide-y">
              {cobro.items.map((it) => (
                <li key={it.id} className="py-2 flex justify-between text-sm">
                  <span className="text-gray-700">{it.nombre_producto} x{it.cantidad}</span>
                  <span className="font-medium">{formatCLP(it.precio_unitario_clp * it.cantidad)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between pt-3 mt-2 border-t text-base font-bold">
              <span>Total</span>
              <span>{formatCLP(cobro.monto_clp)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t flex flex-col sm:flex-row gap-3">
          <Link to="/" className="flex-1 text-center bg-khipu-600 hover:bg-khipu-700 text-white font-semibold py-3 rounded-lg">
            Volver al catalogo
          </Link>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg"
          >
            Imprimir comprobante
          </button>
        </div>
      </div>
    </div>
  )
}

function Info({ label, valor }) {
  return (
    <div>
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="text-gray-800 mt-0.5">{valor}</div>
    </div>
  )
}

function EstadoBadge({ estado }) {
  const styles = {
    pagado: 'bg-green-100 text-green-700',
    pendiente: 'bg-yellow-100 text-yellow-700',
    expirado: 'bg-red-100 text-red-700',
  }
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${styles[estado] || 'bg-gray-100 text-gray-700'}`}>{estado}</span>
}
