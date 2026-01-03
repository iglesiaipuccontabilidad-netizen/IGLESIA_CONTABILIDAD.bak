import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Vote } from 'lucide-react'
import { ComiteVotoForm } from '@/components/comites/ComiteVotoForm'
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function NuevoVotoPage({ params }: PageProps) {
  const { id } = await params
  
  // SEGURIDAD: Validar acceso al comité
  const access = await requireComiteAccess(id)
  const isAdmin = access.isAdmin
  const rolEnComite = access.rolEnComite
  
  const supabase = await createClient()

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  if (!canManage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes permisos para crear votos en este comité.
        </div>
      </div>
    )
  }

  // Obtener comité
  const { data: comite, error: comiteError } = await supabase
    .from('comites')
    .select('nombre')
    .eq('id', id)
    .single()

  if (comiteError || !comite) {
    console.error('Error al cargar comité:', comiteError)
    return notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${id}/votos`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Votos
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
            <Vote className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nuevo Voto</h1>
            <p className="text-slate-600 mt-1">{comite.nombre}</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Información del Voto</h2>
          <p className="text-sm text-slate-600">
            Completa los datos del nuevo compromiso de pago
          </p>
        </div>

        <ComiteVotoForm comiteId={id} />
      </div>
    </div>
  )
}
