import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target, Plus, Calendar, DollarSign, TrendingUp, Activity } from 'lucide-react'
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function ProyectosComitePage({ params }: PageProps) {
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

  // Obtener proyectos del comité
  const { data: proyectos, error: proyectosError } = await supabase
    .from('comite_proyectos')
    .select('*')
    .eq('comite_id', id)
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
          href={`/dashboard/comites/${id}/dashboard`}
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
              href={`/dashboard/comites/${id}/proyectos/nuevo`}
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
              href={`/dashboard/comites/${id}/proyectos/nuevo`}
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
                href={`/dashboard/comites/${id}/proyectos/${proyecto.id}`}
                className="block group"
              >
                <div className="relative bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:shadow-2xl hover:border-purple-400 hover:-translate-y-1 transition-all duration-300">
                  {/* Decorative gradient top */}
                  <div className={`h-1.5 ${isActivo ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : isCompletado ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-slate-300'}`} />
                  
                  <div className="p-6">
                    {/* Header con icono */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                        ${isActivo 
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                          : isCompletado 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                          : 'bg-gradient-to-br from-slate-400 to-slate-500'
                        }
                      `}>
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors mb-1">
                          {proyecto.nombre}
                        </h3>
                        <span className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                          ${isActivo 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : isCompletado
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                          }
                        `}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActivo ? 'bg-emerald-500 animate-pulse' : isCompletado ? 'bg-purple-500' : 'bg-slate-400'}`} />
                          {isActivo ? 'Activo' : isCompletado ? 'Completado' : 'Cancelado'}
                        </span>
                      </div>
                    </div>

                    {proyecto.descripcion && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                        {proyecto.descripcion}
                      </p>
                    )}

                    {/* Progreso (si tiene monto objetivo) */}
                    {proyecto.monto_objetivo && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Progreso
                          </span>
                          <span className={`text-sm font-bold ${porcentaje >= 100 ? 'text-emerald-600' : 'text-purple-600'}`}>
                            {porcentaje.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`
                              h-full rounded-full transition-all duration-500 shadow-sm
                              ${porcentaje >= 100 
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                                : 'bg-gradient-to-r from-purple-500 to-purple-600'
                              }
                            `}
                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Recaudado</p>
                              <p className="text-sm font-bold text-purple-600">
                                ${proyecto.monto_recaudado.toLocaleString('es-CO')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Meta</p>
                            <p className="text-sm font-bold text-slate-900">
                              ${proyecto.monto_objetivo.toLocaleString('es-CO')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fechas */}
                    {(proyecto.fecha_inicio || proyecto.fecha_fin) && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          </div>
                          <span>
                            {proyecto.fecha_inicio && (
                              <span className="font-medium">
                                {new Date(proyecto.fecha_inicio).toLocaleDateString('es-CO', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            )}
                            {proyecto.fecha_inicio && proyecto.fecha_fin && (
                              <span className="mx-1 text-slate-400">→</span>
                            )}
                            {proyecto.fecha_fin && (
                              <span className="font-medium">
                                {new Date(proyecto.fecha_fin).toLocaleDateString('es-CO', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute inset-0 border-2 border-purple-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
