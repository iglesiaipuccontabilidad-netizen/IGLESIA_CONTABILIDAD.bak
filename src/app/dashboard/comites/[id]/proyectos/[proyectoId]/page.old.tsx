import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from '@/components/OrgLink'
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

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes acceso a este comité.
        </div>
      </div>
    )
  }

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
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Votos Asociados
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Votos de miembros que contribuyen a este proyecto
        </p>
      </div>

      {!votos || votos.length === 0 ? (
        <div className="p-12 text-center">
          <Vote className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No hay votos asociados a este proyecto</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Miembro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Monto Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Recaudado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Pendiente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Vencimiento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {votos.map((voto) => {
                const isVencido = new Date(voto.fecha_limite) < new Date()
                const miembro = voto.comite_miembros as any
                const pendiente = voto.monto_total - voto.recaudado

                return (
                  <tr key={voto.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {miembro?.nombres} {miembro?.apellidos}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">
                        ${voto.monto_total.toLocaleString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-emerald-600">
                        ${(voto.recaudado || 0).toLocaleString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-amber-600">
                        ${pendiente.toLocaleString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`
                          inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${voto.estado === 'activo' && !isVencido
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : voto.estado === 'completado'
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }
                        `}
                      >
                        <Activity className="w-3 h-3" />
                        {voto.estado === 'activo' && isVencido ? 'Vencido' : 
                         voto.estado === 'completado' ? 'Completado' : 'Activo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(voto.fecha_limite).toLocaleDateString('es-CO')}
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
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Proyectos
        </Link>

        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <span
                className={`
                  inline-block px-3 py-1 rounded-full text-xs font-medium mb-2
                  ${proyecto.estado === 'activo'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : proyecto.estado === 'completado'
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }
                `}
              >
                {proyecto.estado === 'activo' ? 'Activo' : proyecto.estado === 'completado' ? 'Completado' : 'Cancelado'}
              </span>
              <h1 className="text-3xl font-bold text-slate-900">{proyecto.nombre}</h1>
              <p className="text-slate-600 mt-1">{(proyecto.comites as any)?.nombre}</p>
            </div>
          </div>

          {canManage && (
            <Link
              href={`/dashboard/comites/${id}/proyectos/${proyectoId}/editar`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Edit className="w-5 h-5" />
              Editar Proyecto
            </Link>
          )}
        </div>
      </div>

      {/* Descripción */}
      {proyecto.descripcion && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <p className="text-slate-700 leading-relaxed">{proyecto.descripcion}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Monto Recaudado Total (Votos + Ventas) */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100 text-sm font-medium">Recaudado Total</p>
            <DollarSign className="w-5 h-5 text-purple-200" />
          </div>
          <p className="text-3xl font-bold">
            ${totalRecaudadoCombinado.toLocaleString('es-CO')}
          </p>
          {proyecto.monto_objetivo && (
            <p className="text-purple-100 text-sm mt-1">
              de ${proyecto.monto_objetivo.toLocaleString('es-CO')}
            </p>
          )}
        </div>

        {/* Total Votos */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Votos</p>
            <Vote className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalVotos}</p>
          <p className="text-slate-500 text-sm mt-1">
            ${montoTotalPagado.toLocaleString('es-CO')} pagado
          </p>
        </div>

        {/* Ventas */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Ventas</p>
            <Target className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {resumenVentas?.total_ventas || 0}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            ${totalRecaudadoVentas.toLocaleString('es-CO')} recaudado
          </p>
        </div>

        {/* Porcentaje */}
        {proyecto.monto_objetivo && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Progreso</p>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{porcentaje.toFixed(0)}%</p>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${porcentaje >= 100 ? 'bg-emerald-500' : 'bg-purple-500'}`}
                style={{ width: `${Math.min(porcentaje, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fechas */}
      {(proyecto.fecha_inicio || proyecto.fecha_fin) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-6">
            <Calendar className="w-5 h-5 text-slate-400" />
            {proyecto.fecha_inicio && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Fecha de Inicio</p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(proyecto.fecha_inicio).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
            {proyecto.fecha_fin && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Fecha de Fin</p>
                <p className="text-sm font-medium text-slate-900">
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
