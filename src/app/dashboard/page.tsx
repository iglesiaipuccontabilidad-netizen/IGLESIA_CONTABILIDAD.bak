import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import DashboardCards from '@/components/dashboard/DashboardCards'
import VotosActivosTable from '@/components/dashboard/VotosActivosTable'
import { Database } from '@/lib/database.types'
import { ArrowUpRight, Calendar, Target, TrendingUp, LogOut } from 'lucide-react'
import { getVotosActivos } from '@/app/actions/dashboard'
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

async function getDashboardData(client: SupabaseClient<Database>): Promise<{ stats: DashboardStats; propositos: PropositoRow[] }> {
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

  const stats = (data || []).reduce<DashboardStats>((acc, proposito: PropositoRow) => {
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-slate-50 to-cyan-50 relative overflow-hidden">
        {/* Decoraciones de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-primary-300/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-sky-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container-custom py-8 space-y-8 animate-fade-in relative z-10">
          {/* Header del Dashboard */}
          <div className="page-header">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-slate-600 mt-2 flex items-center space-x-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Resumen general de propósitos y compromisos financieros</span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-primary-200 shadow-sm">
                <span className="text-xs text-primary-600 font-medium">
                  Última actualización: {new Date().toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {/* Botón de cerrar sesión */}
              <LogoutButton collapsed={false} />
            </div>
          </div>

          {/* Sección de Estadísticas */}
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
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

          {/* Progreso global */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-soft">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Progreso global de propósitos</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Seguimiento general del avance de todas las campañas activas y completadas.
                </p>
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                  <span>Avance total</span>
                  <span className="font-semibold text-slate-900">{stats.progreso_general}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${stats.progreso_general}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>{formatCurrency(stats.total_recaudado)} recaudado</span>
                  <span>{formatCurrency(stats.total_pendiente)} pendiente</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resumenRapido.map((item) => (
              <div key={item.title} className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{item.title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{item.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-4">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Propósitos recientes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Propósitos recientes</h2>
                <p className="text-slate-600">Últimas campañas creadas y su avance financiero.</p>
              </div>
              <Link
                href="/dashboard/propositos"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
              >
                Ver todos
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {propositosRecientes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Target className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Aún no hay propósitos registrados</h3>
                <p className="text-slate-600 mt-2">Comienza creando una campaña financiera para la iglesia.</p>
                <Link
                  href="/dashboard/propositos/nuevo"
                  className="inline-flex items-center gap-2 px-6 py-3 mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all"
                >
                  Crear nuevo propósito
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {propositosRecientes.map((proposito) => {
                  const objetivo = proposito.monto_objetivo ?? 0
                  const recaudado = proposito.monto_recaudado ?? 0
                  const progreso = objetivo > 0 ? Math.min(Math.round((recaudado / objetivo) * 100), 100) : 0

                  const estadoBadge = proposito.estado === 'activo'
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : proposito.estado === 'completado'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'

                  return (
                    <Link
                      key={proposito.id}
                      href={`/dashboard/propositos/${proposito.id}`}
                      className="group bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 pr-2">
                          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {proposito.nombre}
                          </h3>
                          {proposito.descripcion && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{proposito.descripcion}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${estadoBadge}`}>
                          {proposito.estado}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span>Progreso</span>
                          <span className="font-semibold text-slate-900">{progreso}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${progreso}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Recaudado</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(recaudado)}</span>
                        </div>
                        {objetivo > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Meta</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(objetivo)}</span>
                          </div>
                        )}
                        {proposito.fecha_fin && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                            <Calendar className="w-4 h-4" />
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
