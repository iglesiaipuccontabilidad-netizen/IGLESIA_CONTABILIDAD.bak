import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from '@/components/OrgLink'
import { ArrowLeft, Target } from 'lucide-react'
import { ComiteProyectoForm } from '@/components/comites/ComiteProyectoForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function NuevoProyectoPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener rol del usuario
  const { data: userData } = await supabase
    .from('organizacion_usuarios')
    .select('rol')
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .maybeSingle()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

  // Verificar acceso al comité
  let hasAccess = isAdmin
  let rolEnComite = null

  if (!isAdmin) {
    const { data: comiteUsuario } = await supabase
      .from('comite_usuarios')
      .select('rol')
      .eq('comite_id', id)
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .single()

    hasAccess = !!comiteUsuario
    rolEnComite = comiteUsuario?.rol
  }

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  if (!hasAccess || !canManage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes permisos para crear proyectos en este comité.
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${id}/proyectos`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 mb-6 transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a Proyectos
        </Link>

        <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50/30 rounded-2xl border-2 border-purple-200 p-8 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-500/30">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Nuevo Proyecto</h1>
              <p className="text-slate-600 mt-1 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                {comite.nombre}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-white p-8 border-b-2 border-slate-200">
          <h2 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="w-4 h-4 text-purple-600" />
            </div>
            Información del Proyecto
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            Completa los datos del nuevo proyecto o campaña de recaudación
          </p>
        </div>

        <div className="p-8">
          <ComiteProyectoForm comiteId={id} />
        </div>
      </div>
    </div>
  )
}
