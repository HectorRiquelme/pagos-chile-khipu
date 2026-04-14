export function formatCLP(monto) {
  if (monto === null || monto === undefined) return ''
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(monto)
}

export function formatFecha(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const BANCOS_CL = [
  { id: 'banco_estado', nombre: 'BancoEstado', color: 'bg-yellow-500' },
  { id: 'banco_chile', nombre: 'Banco de Chile', color: 'bg-blue-700' },
  { id: 'santander', nombre: 'Santander', color: 'bg-red-600' },
  { id: 'bci', nombre: 'BCI', color: 'bg-blue-900' },
  { id: 'scotiabank', nombre: 'Scotiabank', color: 'bg-red-700' },
  { id: 'itau', nombre: 'Itaú', color: 'bg-orange-600' },
  { id: 'banco_falabella', nombre: 'Banco Falabella', color: 'bg-green-700' },
  { id: 'banco_ripley', nombre: 'Banco Ripley', color: 'bg-pink-600' },
]
