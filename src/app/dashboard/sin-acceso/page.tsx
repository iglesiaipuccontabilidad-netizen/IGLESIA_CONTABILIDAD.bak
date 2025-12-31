import Link from 'next/link'
import { ShieldAlert, Home, Users } from 'lucide-react'

export default function SinAccesoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Acceso Restringido
        </h1>
        
        <p className="text-slate-600 mb-8">
          No tienes permisos para acceder a esta sección. Por favor contacta al administrador si crees que esto es un error.
        </p>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Volver al inicio
          </Link>
          
          <Link
            href="/dashboard/comites"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Users className="w-5 h-5" />
            Ver mis comités
          </Link>
        </div>
      </div>
    </div>
  )
}
