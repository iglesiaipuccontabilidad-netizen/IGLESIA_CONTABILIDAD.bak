import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target } from 'lucide-react'
import { ComiteProyectoForm } from '@/components/comites/ComiteProyectoForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{
    id: string
    proyectoId: string
  }>
}

export default async function EditarProyectoPage({ params }: PageProps) {
  const { id, proyectoId } = await params
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
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

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
          No tienes permisos para editar proyectos en este comité.
        </div>
      </div>
    )
  }

  // Obtener proyecto
  const { data: proyecto, error: proyectoError } = await supabase
    .from('comite_proyectos')
    .select('*, comites(nombre)')
    .eq('id', proyectoId)
    .eq('comite_id', id)
    .single()

  if (proyectoError || !proyecto) {
    console.error('Error al cargar proyecto:', proyectoError)
    return notFound()
  }

  // Preparar datos iniciales para el formulario
  const initialData = {
    nombre: proyecto.nombre,
    descripcion: proyecto.descripcion || '',
    monto_objetivo: proyecto.monto_objetivo?.toString() || '',
    fecha_inicio: proyecto.fecha_inicio || '',
    fecha_fin: proyecto.fecha_fin || '',
    estado: proyecto.estado as 'activo' | 'completado' | 'cancelado',
    monto_recaudado: proyecto.monto_recaudado,
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${id}/proyectos/${proyectoId}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Proyecto
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Editar Proyecto</h1>
            <p className="text-slate-600 mt-1">{(proyecto.comites as any)?.nombre}</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Información del Proyecto</h2>
          <p className="text-sm text-slate-600">
            Actualiza los datos del proyecto
          </p>
        </div>

        <ComiteProyectoForm
          comiteId={id}
          proyectoId={proyectoId}
          initialData={initialData}
        />
      </div>
    </div>
  )
}
