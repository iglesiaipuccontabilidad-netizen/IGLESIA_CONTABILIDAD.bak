import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit,
  Vote,
  Users,
  Activity,
} from 'lucide-react'
import { ProyectoTabs } from '@/components/comites/ProyectoTabs'
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
    proyectoId: string
  }
}

export default async function DetalleProyectoPage({ params }: PageProps) {
  const { id, proyectoId } = await params
  
  // SEGURIDAD: Validar acceso al comité
  const access = await requireComiteAccess(id)
  const isAdmin = access.isAdmin
  const rolEnComite = access.rolEnComite
  
  const supabase = await createClient()

  // Obtener proyecto con datos del comité
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

  // Obtener votos asociados al proyecto
  const { data: votos, error: votosError } = await supabase
    .from('comite_votos')
    .select(`
      *,
      comite_miembros (
        id,
        nombres,
        apellidos
      )
    `)
    .eq('comite_id', id)
    .eq('proyecto_id', proyectoId)
    .order('created_at', { ascending: false })

  // Obtener productos del proyecto
  const { data: productos } = await supabase
    .from('proyecto_productos')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('created_at', { ascending: false })

  // Obtener ventas del proyecto
  const { data: ventas } = await supabase
    .from('proyecto_ventas')
    .select(`
      *,
      proyecto_productos (
        id,
        nombre,
        precio_unitario
      )
    `)
    .eq('proyecto_id', proyectoId)
    .order('created_at', { ascending: false })

  // Obtener resumen de ventas
  const { data: resumenVentas } = await supabase
    .from('vista_resumen_ventas_proyecto')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .single()

  // Ignorar errores vacíos {}
  const isEmptyVotosError = votosError && 
    typeof votosError === 'object' && 
    Object.keys(votosError).length === 0
  
  if (votosError && !isEmptyVotosError) {
    console.error('Error al cargar votos:', votosError)
  }

  // Calcular estadísticas
  const totalVotos = votos?.length || 0
  const votosActivos = votos?.filter((v) => v.estado === 'activo' && new Date(v.fecha_limite) > new Date()).length || 0
  const montoTotalPagado = votos?.reduce((sum, v) => sum + (v.recaudado || 0), 0) || 0

  // Calcular progreso combinando votos y ventas
  const totalRecaudadoVentas = resumenVentas?.total_recaudado || 0
  const totalRecaudadoCombinado = montoTotalPagado + totalRecaudadoVentas

  const porcentaje = proyecto.monto_objetivo && proyecto.monto_objetivo > 0
    ? (totalRecaudadoCombinado / proyecto.monto_objetivo) * 100
    : 0

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  // Contenido de la pestaña de votos
  const votosContent = (
    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-purple-50 to-white p-6 border-b-2 border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div>Votos Asociados</div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Votos de miembros que contribuyen a este proyecto
            </p>
          </div>
        </h2>
      </div>

      {!votos || votos.length === 0 ? (
        <div className="p-16 text-center bg-gradient-to-br from-slate-50 to-white">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Vote className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Sin votos asociados</h3>
          <p className="text-slate-600">No hay votos asociados a este proyecto aún</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                  Miembro
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                  Monto Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                  Recaudado
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                  Pendiente
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                  Vencimiento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {votos.map((voto) => {
                const isVencido = new Date(voto.fecha_limite) < new Date()
                const miembro = voto.comite_miembros as any
                const pendiente = voto.monto_total - voto.recaudado

                return (
                  <tr key={voto.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {miembro?.nombres?.charAt(0)}{miembro?.apellidos?.charAt(0)}
                        </div>
                        <div className="font-bold text-slate-900">
                          {miembro?.nombres} {miembro?.apellidos}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base font-black text-slate-900">
                        ${voto.monto_total.toLocaleString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-black text-emerald-700">
                          ${(voto.recaudado || 0).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-sm font-black text-amber-700">
                          ${pendiente.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`
                          inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black
                          ${voto.estado === 'activo' && !isVencido
                            ? 'bg-emerald-100 text-emerald-700'
                            : voto.estado === 'completado'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-rose-100 text-rose-700'
                          }
                        `}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          voto.estado === 'activo' && !isVencido 
                            ? 'bg-emerald-500 animate-pulse' 
                            : voto.estado === 'completado' 
                            ? 'bg-purple-500' 
                            : 'bg-rose-500'
                        }`} />
                        {voto.estado === 'activo' && isVencido ? 'Vencido' : 
                         voto.estado === 'completado' ? 'Completado' : 'Activo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-600">
                        {new Date(voto.fecha_limite).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${id}/proyectos`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 mb-6 transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a Proyectos
        </Link>

        <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50/30 rounded-2xl border-2 border-purple-200 p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-xl shadow-purple-500/30">
                <Target className="w-10 h-10 text-white" />
              </div>
              <div>
                <span
                  className={`
                    inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3
                    ${proyecto.estado === 'activo'
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-200/50'
                      : proyecto.estado === 'completado'
                      ? 'bg-purple-100 text-purple-700 shadow-sm shadow-purple-200/50'
                      : 'bg-slate-100 text-slate-600'
                    }
                  `}
                >
                  <span className={`w-2 h-2 rounded-full ${proyecto.estado === 'activo' ? 'bg-emerald-500 animate-pulse' : proyecto.estado === 'completado' ? 'bg-purple-500' : 'bg-slate-400'}`} />
                  {proyecto.estado === 'activo' ? 'Activo' : proyecto.estado === 'completado' ? 'Completado' : 'Cancelado'}
                </span>
                <h1 className="text-4xl font-black text-slate-900 mb-2">{proyecto.nombre}</h1>
                <p className="text-slate-600 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {(proyecto.comites as any)?.nombre}
                </p>
              </div>
            </div>

            {canManage && (
              <Link
                href={`/dashboard/comites/${id}/proyectos/${proyectoId}/editar`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all shadow-lg shadow-purple-500/30"
              >
                <Edit className="w-5 h-5" />
                Editar Proyecto
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Descripción */}
      {proyecto.descripcion && (
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Descripción</h3>
              <p className="text-slate-700 leading-relaxed">{proyecto.descripcion}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Monto Recaudado Total (Votos + Ventas) */}
        <div className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-6 text-white overflow-hidden shadow-xl shadow-purple-500/30 hover:scale-105 transition-transform">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-purple-100 text-xs font-bold uppercase tracking-wider">Recaudado Total</p>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-4xl font-black mb-2">
              ${totalRecaudadoCombinado.toLocaleString('es-CO')}
            </p>
            {proyecto.monto_objetivo && (
              <p className="text-purple-100 text-sm font-medium">
                de ${proyecto.monto_objetivo.toLocaleString('es-CO')}
              </p>
            )}
          </div>
        </div>

        {/* Total Votos */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-primary-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">Votos</p>
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Vote className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <p className="text-4xl font-black text-slate-900 mb-2">{totalVotos}</p>
          <p className="text-slate-500 text-sm font-semibold">
            ${montoTotalPagado.toLocaleString('es-CO')} pagado
          </p>
        </div>

        {/* Ventas */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">Ventas</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-4xl font-black text-slate-900 mb-2">
            {resumenVentas?.total_ventas || 0}
          </p>
          <p className="text-slate-500 text-sm font-semibold">
            ${totalRecaudadoVentas.toLocaleString('es-CO')} recaudado
          </p>
        </div>

        {/* Porcentaje */}
        {proyecto.monto_objetivo && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">Progreso</p>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className={`text-4xl font-black mb-3 ${porcentaje >= 100 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {porcentaje.toFixed(0)}%
            </p>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full shadow-sm transition-all duration-500 ${porcentaje >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-purple-500 to-purple-600'}`}
                style={{ width: `${Math.min(porcentaje, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fechas */}
      {(proyecto.fecha_inicio || proyecto.fecha_fin) && (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 mb-8 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            {proyecto.fecha_inicio && (
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Fecha de Inicio</p>
                <p className="text-base font-bold text-slate-900">
                  {new Date(proyecto.fecha_inicio).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
            {proyecto.fecha_inicio && proyecto.fecha_fin && (
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-slate-600 rotate-180" />
              </div>
            )}
            {proyecto.fecha_fin && (
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Fecha de Fin</p>
                <p className="text-base font-bold text-slate-900">
                  {new Date(proyecto.fecha_fin).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs: Votos, Productos, Ventas, Reportes */}
      <ProyectoTabs
        proyectoId={proyectoId}
        comiteId={id}
        canManage={canManage}
        votosContent={votosContent}
        productos={productos || []}
        ventas={ventas || []}
        resumenVentas={resumenVentas}
      />
    </div>
  )
}
