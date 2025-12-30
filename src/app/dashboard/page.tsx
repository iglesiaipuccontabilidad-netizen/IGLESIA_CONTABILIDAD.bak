import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import DashboardCards from '@/components/dashboard/DashboardCards'
import { Database } from '@/lib/database.types'
import { ArrowUpRight, Calendar, Target, TrendingUp, LogOut } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

interface DashboardStats {
  total_comprometido: number
  total_recaudado: number
  total_pendiente: number
  propositos_activos: number
  propositos_completados: number
  propositos_cancelados: number
  progreso_general: number
}

type PropositoRow = Database['public']['Tables']['propositos']['Row']

// Tipo para los datos parciales que seleccionamos
interface PropositoData {
  id: string
  nombre: string
  descripcion: string | null
  monto_objetivo: number | null
  monto_recaudado: number
  estado: string
  fecha_fin: string | null
  fecha_inicio: string | null
  created_at: string | null
}

interface Voto {
  id: string
  proposito: string
  monto: number
  recaudado: number
  fecha_limite: string
  miembro: {
    nombres: string
    apellidos: string
  }
}

// Configuración de la página
export const dynamic = 'force-dynamic'
export const revalidate = 0

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(value)

async function getDashboardData(client: SupabaseClient<Database>): Promise<{ stats: DashboardStats; propositos: PropositoData[] }> {
  const { data, error } = await client
    .from('propositos')
    .select('id, nombre, descripcion, monto_objetivo, monto_recaudado, estado, fecha_fin, fecha_inicio, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al obtener propósitos:', error)
    return {
      stats: {
        total_comprometido: 0,
        total_recaudado: 0,
        total_pendiente: 0,
        propositos_activos: 0,
        propositos_completados: 0,
        propositos_cancelados: 0,
        progreso_general: 0
      },
      propositos: []
    }
  }

  const stats = (data || []).reduce<DashboardStats>((acc, proposito) => {
    const objetivo = proposito.monto_objetivo ?? 0
    const recaudado = proposito.monto_recaudado ?? 0

    acc.total_comprometido += objetivo
    acc.total_recaudado += recaudado

    switch (proposito.estado) {
      case 'completado':
        acc.propositos_completados += 1
        break
      case 'cancelado':
        acc.propositos_cancelados += 1
        break
      default:
        acc.propositos_activos += 1
        break
    }

    return acc
  }, {
    total_comprometido: 0,
    total_recaudado: 0,
    total_pendiente: 0,
    propositos_activos: 0,
    propositos_completados: 0,
    propositos_cancelados: 0,
    progreso_general: 0
  })

  stats.total_pendiente = Math.max(stats.total_comprometido - stats.total_recaudado, 0)
  stats.progreso_general = stats.total_comprometido > 0
    ? Math.min(Math.round((stats.total_recaudado / stats.total_comprometido) * 100), 100)
    : 0

  return {
    stats,
    propositos: data || []
  }
}

// Componente principal del Dashboard  
export default async function DashboardPage() {
  try {
    const supabase = await createClient()
    const { stats, propositos } = await getDashboardData(supabase)

    const propositosRecientes = propositos.slice(0, 4)
    const resumenRapido = [
      {
        title: 'Campañas completadas',
        value: stats.propositos_completados,
        description: 'Propósitos que alcanzaron su objetivo',
        icon: <TrendingUp className="w-5 h-5 text-emerald-600" />
      },
      {
        title: 'Campañas activas',
        value: stats.propositos_activos,
        description: 'Propósitos actualmente en progreso',
        icon: <Target className="w-5 h-5 text-blue-600" />
      },
      {
        title: 'Campañas canceladas',
        value: stats.propositos_cancelados,
        description: 'Propósitos detenidos o cancelados',
        icon: <ArrowUpRight className="w-5 h-5 text-rose-500 rotate-45" />
      }
    ]

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
        {/* Decoraciones de fondo mejoradas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/15 to-blue-400/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-br from-cyan-400/15 to-primary-300/15 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 right-1/3 w-72 h-72 bg-gradient-to-br from-emerald-400/15 to-cyan-400/15 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10 animate-fade-in relative z-10">
          {/* Header del Dashboard - Mejorado */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 bg-clip-text text-transparent mb-3 leading-tight">
                Dashboard
              </h1>
              <p className="text-slate-600 text-base md:text-lg flex items-center space-x-3">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
                <span>Resumen general de propósitos y compromisos financieros</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="px-6 py-4 bg-white border border-slate-300 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center sm:text-right">
                <span className="text-xs text-slate-600 font-semibold block mb-1">Última actualización</span>
                <span className="text-sm text-primary-600 font-bold">{new Date().toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              {/* Botón de cerrar sesión */}
              <LogoutButton collapsed={false} />
            </div>
          </div>

          {/* Sección de Estadísticas - KPIs */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 px-1">Métricas clave</h2>
            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            }>
              <DashboardCards
                totalComprometido={stats.total_comprometido}
                totalRecaudado={stats.total_recaudado}
                totalPendiente={stats.total_pendiente}
                propositosActivos={stats.propositos_activos}
              />
            </Suspense>
          </div>

          {/* Progreso global - Mejorado */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Progreso global de propósitos</h2>
                <p className="text-slate-600 text-sm">
                  Seguimiento del avance en todas las campañas activas y completadas
                </p>
              </div>
              <div className="w-full lg:w-2/5">
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold text-slate-700">Avance general</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-cyan-600 bg-clip-text text-transparent">{stats.progreso_general}%</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-700 shadow-md"
                      style={{ width: `${stats.progreso_general}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Grid de resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/50 min-w-0">
                <span className="block text-xs text-emerald-600 font-semibold mb-1">Recaudado</span>
                <span className="block text-lg font-bold text-emerald-700 break-words">{formatCurrency(stats.total_recaudado)}</span>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/50 min-w-0">
                <span className="block text-xs text-amber-600 font-semibold mb-1">Pendiente</span>
                <span className="block text-lg font-bold text-amber-700 break-words">{formatCurrency(stats.total_pendiente)}</span>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200/50 min-w-0">
                <span className="block text-xs text-blue-600 font-semibold mb-1">Comprometido</span>
                <span className="block text-lg font-bold text-blue-700 break-words">{formatCurrency(stats.total_comprometido)}</span>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200/50 min-w-0">
                <span className="block text-xs text-purple-600 font-semibold mb-1">Campañas activas</span>
                <span className="block text-lg font-bold text-purple-700">{stats.propositos_activos}</span>
              </div>
            </div>
          </div>

          {/* Resumen rápido - Mejorado */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 px-1">Información adicional</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {resumenRapido.map((item, idx) => (
                <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">{item.title}</p>
                      <p className="text-3xl font-bold text-slate-900">{item.value}</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mt-3 border-t border-slate-100 pt-3">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Propósitos recientes */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Propósitos recientes</h2>
                <p className="text-slate-600 text-sm mt-1">Últimas campañas creadas y su avance financiero</p>
              </div>
              <Link
                href="/dashboard/propositos"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all"
              >
                Ver todas las campañas
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {propositosRecientes.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                  <Target className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Aún no hay propósitos registrados</h3>
                <p className="text-slate-600 mb-8 max-w-sm mx-auto">Comienza creando una campaña financiera para la iglesia y haz seguimiento a tu progreso.</p>
                <Link
                  href="/dashboard/propositos/nuevo"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-cyan-700 transition-all hover:shadow-lg"
                >
                  <span>Crear nueva campaña</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {propositosRecientes.map((proposito) => {
                  const objetivo = proposito.monto_objetivo ?? 0
                  const recaudado = proposito.monto_recaudado ?? 0
                  const progreso = objetivo > 0 ? Math.min(Math.round((recaudado / objetivo) * 100), 100) : 0

                  const estadoBadge = proposito.estado === 'activo'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : proposito.estado === 'completado'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'

                  return (
                    <Link
                      key={proposito.id}
                      href={`/dashboard/propositos/${proposito.id}`}
                      className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {proposito.nombre}
                          </h3>
                          {proposito.descripcion && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{proposito.descripcion}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap flex-shrink-0 ${estadoBadge}`}>
                          {proposito.estado}
                        </span>
                      </div>

                      {/* Progreso */}
                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">Progreso</span>
                          <span className="font-bold text-slate-900">{progreso}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${progreso}%` }}
                          ></div>
                        </div>

                        {/* Financiero */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="p-2.5 bg-slate-50 rounded-lg min-w-0">
                            <span className="block text-xs text-slate-600 font-semibold mb-1">Recaudado</span>
                            <span className="block text-sm font-bold text-slate-900 truncate">{formatCurrency(recaudado)}</span>
                          </div>
                          {objetivo > 0 && (
                            <div className="p-2.5 bg-slate-50 rounded-lg min-w-0">
                              <span className="block text-xs text-slate-600 font-semibold mb-1">Meta</span>
                              <span className="block text-sm font-bold text-slate-900 truncate">{formatCurrency(objetivo)}</span>
                            </div>
                          )}
                        </div>

                        {/* Fecha */}
                        {proposito.fecha_fin && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>Finaliza {new Date(proposito.fecha_fin).toLocaleDateString('es-CO')}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error en el dashboard:', error)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="alert alert-danger max-w-md">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold">Error al cargar el dashboard</h3>
            <p className="text-sm mt-1">Por favor, intenta recargar la página.</p>
          </div>
        </div>
      </div>
    )
  }
}
