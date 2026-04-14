import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BANCOS_CL, formatCLP, formatFecha } from '../utils.js'

export default function KhipuBanco() {
  const { cobroId } = useParams()
  const navigate = useNavigate()
  const [cobro, setCobro] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [bancoSel, setBancoSel] = useState(null)
  const [paso, setPaso] = useState(1) // 1: elegir banco, 2: confirmar transferencia
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    fetch(`/api/cobros/${cobroId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Cobro no encontrado')
        return r.json()
      })
      .then((data) => setCobro(data))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [cobroId])

  const seleccionarBanco = (b) => {
    setBancoSel(b)
    setPaso(2)
  }

  const confirmarTransferencia = async () => {
    setProcesando(true)
    setError(null)
    try {
      // Paso 1: simular confirmacion del usuario (llamada al endpoint del banco mock)
      // Paso 2: dispara webhook de Khipu hacia el backend
      const res = await fetch('/api/webhook/khipu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cobro_id: parseInt(cobroId, 10),
          estado: 'pagado',
          banco: bancoSel?.nombre,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'No se pudo confirmar el pago')
      }
      navigate(`/comprobante/${cobroId}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setProcesando(false)
    }
  }

  const cancelar = () => {
    navigate('/')
  }

  if (cargando) {
    return <div className="max-w-xl mx-auto p-8 text-gray-600">Cargando cobro...</div>
  }
  if (error && !cobro) {
    return (
      <div className="max-w-xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">{error}</div>
      </div>
    )
  }
  if (!cobro) return null

  const expirado = cobro.estado === 'expirado'
  const pagado = cobro.estado === 'pagado'

  return (
    <div className="min-h-screen bg-khipu-50">
      {/* Header Khipu mock */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-khipu-600 flex items-center justify-center text-white font-bold">
            Kh
          </div>
          <div>
            <div className="font-bold text-khipu-700 text-lg leading-none">khipu</div>
            <div className="text-xs text-gray-500">Pagos por transferencia bancaria</div>
          </div>
          <div className="ml-auto text-xs text-gray-500">Conexion segura SSL</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase">Cobro</div>
                <div className="font-mono text-gray-800">{cobro.codigo}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Expira: {formatFecha(cobro.expira_en)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase">Monto a pagar</div>
                <div className="text-3xl font-bold text-khipu-700">{formatCLP(cobro.monto_clp)}</div>
              </div>
            </div>
          </div>

          {expirado && (
            <div className="p-6 bg-red-50 border-b border-red-200 text-red-700">
              Este cobro esta expirado. Vuelve al catalogo para generar uno nuevo.
            </div>
          )}
          {pagado && (
            <div className="p-6 bg-green-50 border-b border-green-200 text-green-700">
              Este cobro ya fue pagado.{' '}
              <button
                className="underline font-semibold"
                onClick={() => navigate(`/comprobante/${cobroId}`)}
              >
                Ver comprobante
              </button>
            </div>
          )}

          {!expirado && !pagado && paso === 1 && (
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">1. Elige tu banco</h2>
              <p className="text-sm text-gray-500 mb-5">
                Selecciona el banco desde el cual realizaras la transferencia.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {BANCOS_CL.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => seleccionarBanco(b)}
                    className="flex items-center gap-3 border border-gray-200 rounded-lg p-3 hover:border-khipu-500 hover:bg-khipu-50 transition text-left"
                  >
                    <div className={`w-10 h-10 rounded ${b.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {b.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{b.nombre}</div>
                      <div className="text-xs text-gray-500">Transferencia electronica</div>
                    </div>
                    <div className="text-gray-400">&gt;</div>
                  </button>
                ))}
              </div>
              <button onClick={cancelar} className="mt-6 text-sm text-gray-500 hover:underline">
                Cancelar y volver
              </button>
            </div>
          )}

          {!expirado && !pagado && paso === 2 && (
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">2. Confirma tu transferencia</h2>
              <p className="text-sm text-gray-500 mb-5">
                Ingresa a tu cuenta en <span className="font-semibold">{bancoSel?.nombre}</span> y confirma la transferencia por el monto indicado.
              </p>

              <div className="bg-khipu-50 border border-khipu-100 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Banco destino:</span><span className="font-semibold">{bancoSel?.nombre}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Monto:</span><span className="font-semibold">{formatCLP(cobro.monto_clp)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Referencia:</span><span className="font-mono">{cobro.codigo}</span></div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={confirmarTransferencia}
                  disabled={procesando}
                  className="flex-1 bg-khipu-600 hover:bg-khipu-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg"
                >
                  {procesando ? 'Confirmando...' : 'Confirmar transferencia'}
                </button>
                <button
                  onClick={() => setPaso(1)}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg"
                >
                  Cambiar banco
                </button>
              </div>
              <button onClick={cancelar} className="mt-4 text-sm text-gray-500 hover:underline">
                Cancelar y volver
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Este es un ambiente de prueba. No se realizan movimientos reales de dinero.
        </p>
      </div>
    </div>
  )
}
