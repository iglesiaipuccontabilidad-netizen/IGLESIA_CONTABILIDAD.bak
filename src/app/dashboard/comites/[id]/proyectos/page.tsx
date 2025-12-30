import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target, Plus, Calendar, DollarSign, TrendingUp, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function ProyectosComitePage({ params }: PageProps) {
  const supabase = await createClient()

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
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
      .eq('comite_id', params.id)
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .single()

    hasAccess = !!comiteUsuario
    rolEnComite = comiteUsuario?.rol
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes acceso a este comité.
        </div>
      </div>
    )
  }

  // Obtener comité
  const { data: comite, error: comiteError } = await supabase
    .from('comites')
    .select('*')
    .eq('id', params.id)
    .single()

  if (comiteError || !comite) {
    console.error('Error al cargar comité:', comiteError)
    return notFound()
  }

  // Obtener proyectos del comité
  const { data: proyectos, error: proyectosError } = await supabase
    .from('comite_proyectos')
    .select('*')
    .eq('comite_id', params.id)
    .order('created_at', { ascending: false })

  if (proyectosError) {
    console.error('Error al cargar proyectos:', proyectosError)
  }

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${params.id}/dashboard`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              Proyectos: {comite.nombre}
            </h1>
            <p className="text-slate-600 mt-2">
              Gestiona los proyectos y campañas de recaudación del comité
            </p>
          </div>

          {canManage && (
            <Link
              href={`/dashboard/comites/${params.id}/proyectos/nuevo`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Nuevo Proyecto
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Proyectos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{proyectos?.length || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Activos</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {proyectos?.filter((p) => p.estado === 'activo').length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Completados</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">
                {proyectos?.filter((p) => p.estado === 'completado').length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Proyectos */}
      {!proyectos || proyectos.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
          <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No hay proyectos creados
          </h3>
          <p className="text-slate-600 mb-6">
            Crea el primer proyecto para comenzar a organizar la recaudación de fondos
          </p>
          {canManage && (
            <Link
              href={`/dashboard/comites/${params.id}/proyectos/nuevo`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Proyecto
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proyectos.map((proyecto) => {
            const porcentaje = proyecto.monto_objetivo && proyecto.monto_objetivo > 0
              ? (proyecto.monto_recaudado / proyecto.monto_objetivo) * 100
              : 0

            const isActivo = proyecto.estado === 'activo'
            const isCompletado = proyecto.estado === 'completado'

            return (
              <Link
                key={proyecto.id}
                href={`/dashboard/comites/${params.id}/proyectos/${proyecto.id}`}
                className="block group"
              >
                <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-200">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                        {proyecto.nombre}
                      </h3>
                      {proyecto.descripcion && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {proyecto.descripcion}
                        </p>
                      )}
                    </div>

                    <span
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                        ${isActivo 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : isCompletado
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }
                      `}
                    >
                      <Activity className="w-3 h-3" />
                      {isActivo ? 'Activo' : isCompletado ? 'Completado' : 'Cancelado'}
                    </span>
                  </div>

                  {/* Progreso (si tiene monto objetivo) */}
                  {proyecto.monto_objetivo && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>Progreso</span>
                        <span className="font-medium">{porcentaje.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`
                            h-full rounded-full transition-all
                            ${porcentaje >= 100 
                              ? 'bg-emerald-500' 
                              : 'bg-purple-500'
                            }
                          `}
                          style={{ width: `${Math.min(porcentaje, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-purple-600">
                            ${proyecto.monto_recaudado.toLocaleString('es-CO')}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span>${proyecto.monto_objetivo.toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fechas */}
                  {(proyecto.fecha_inicio || proyecto.fecha_fin) && (
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {proyecto.fecha_inicio && (
                          <span>
                            {new Date(proyecto.fecha_inicio).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                        )}
                        {proyecto.fecha_inicio && proyecto.fecha_fin && ' - '}
                        {proyecto.fecha_fin && (
                          <span>
                            {new Date(proyecto.fecha_fin).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
