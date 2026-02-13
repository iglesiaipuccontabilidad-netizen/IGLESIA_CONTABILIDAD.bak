import Link from '@/components/OrgLink'
import { ShieldAlert, Home, Users, ArrowLeft } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

export default function SinAccesoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
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
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Home className="w-5 h-5" />
              Ir al Dashboard
            </Link>
            
            <Link
              href="/dashboard/comites"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              <Users className="w-5 h-5" />
              Ver mis comités
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-4">
              ¿Necesitas ayuda? Contacta al administrador del sistema
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
