import { requireAdminOrTesorero } from '@/lib/auth/permissions'
import Link from '@/components/OrgLink'
import { ArrowLeft } from 'lucide-react'
import NuevoComiteForm from '@/components/comites/NuevoComiteForm'

export default async function NuevoComitePage() {
  // SEGURIDAD: Validar que solo admin/tesorero puede acceder
  await requireAdminOrTesorero()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/comites"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Comités
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-900">
          Crear Nuevo Comité
        </h1>
        <p className="text-slate-600 mt-2">
          Configura un nuevo comité con contabilidad independiente
        </p>
      </div>

      {/* Formulario */}
      <NuevoComiteForm />

      {/* Ayuda */}
      <div className="mt-6 bg-primary-50 rounded-lg border border-primary-100 p-6">
        <h3 className="font-semibold text-primary-900 mb-2">💡 Siguiente paso</h3>
        <p className="text-sm text-primary-700">
          Después de crear el comité, podrás asignar usuarios (Líder, Tesorero, Secretario) y 
          agregar miembros para comenzar a gestionar su contabilidad de forma independiente.
        </p>
      </div>
    </div>
  )
}
