import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from '@/components/OrgLink'
import { ArrowLeft, Vote, Plus } from 'lucide-react'
import { VotosComiteTable } from '@/components/comites/VotosComiteTable'
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function VotosComitePage({ params }: PageProps) {
  const { id } = await params
  
  // SEGURIDAD: Validar acceso al comité
  const access = await requireComiteAccess(id)
  const isAdmin = access.isAdmin
  const rolEnComite = access.rolEnComite
  
  const supabase = await createClient()

  // Obtener comité
  const { data: comite, error: comiteError } = await supabase
    .from('comites')
    .select('*')
    .eq('id', id)
    .single()

  if (comiteError || !comite) {
    console.error('Error al cargar comité:', comiteError)
    return notFound()
  }

  // Obtener votos del comité con miembros y proyectos
  const { data: votos, error: votosError } = await supabase
    .from('comite_votos')
    .select(`
      *,
      comite_miembros (
        id,
        nombres,
        apellidos
      ),
      comite_proyectos (nombre)
    `)
    .eq('comite_id', id)
    .order('created_at', { ascending: false })

  // Ignorar errores vacíos {}
  const isEmptyVotosError = votosError && 
    typeof votosError === 'object' && 
    Object.keys(votosError).length === 0
  
  if (votosError && !isEmptyVotosError) {
    console.error('Error al cargar votos:', votosError)
  }

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${id}/dashboard`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <Vote className="w-6 h-6 text-white" />
              </div>
              Votos: {comite.nombre}
            </h1>
            <p className="text-slate-600 mt-2">
              Gestiona los votos y pagos del comité
            </p>
          </div>

          {canManage && (
            <Link
              href={`/dashboard/comites/${id}/votos/nuevo`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Nuevo Voto
            </Link>
          )}
        </div>
      </div>

      {/* Tabla de Votos */}
      {!votos || votos.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
          <Vote className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No hay votos creados
          </h3>
          <p className="text-slate-600 mb-6">
            Crea el primer voto para comenzar a registrar compromisos de pago
          </p>
          {canManage && (
            <Link
              href={`/dashboard/comites/${id}/votos/nuevo`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Voto
            </Link>
          )}
        </div>
      ) : (
        <VotosComiteTable votos={votos as any} comiteId={id} />
      )}
    </div>
  )
}
