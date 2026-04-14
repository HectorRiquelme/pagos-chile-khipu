import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Catalogo from './pages/Catalogo.jsx'
import KhipuBanco from './pages/KhipuBanco.jsx'
import Comprobante from './pages/Comprobante.jsx'
import Admin from './pages/Admin.jsx'

function Header() {
  const { pathname } = useLocation()
  const esKhipu = pathname.startsWith('/khipu')
  if (esKhipu) return null
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-khipu-600 flex items-center justify-center text-white font-bold">
            Kh
          </div>
          <span className="text-xl font-bold text-gray-800">Tienda Chilena</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/" className="text-gray-700 hover:text-khipu-600">Catalogo</Link>
          <Link to="/admin" className="text-gray-700 hover:text-khipu-600">Panel Admin</Link>
        </nav>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/khipu/:cobroId" element={<KhipuBanco />} />
        <Route path="/comprobante/:cobroId" element={<Comprobante />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  )
}
