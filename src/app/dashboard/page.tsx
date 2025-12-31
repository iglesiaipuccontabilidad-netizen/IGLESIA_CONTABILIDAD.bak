import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import DashboardCards from '@/components/dashboard/DashboardCards'
import { ProgressSection } from '@/components/dashboard/ProgressSection'
import { QuickSummarySection } from '@/components/dashboard/QuickSummarySection'
import { RecentPropositionsSection } from '@/components/dashboard/RecentPropositionsSection'
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary'
import { Database } from '@/lib/database.types'
import LogoutButton from '@/components/LogoutButton'
import { ComiteUserRedirect } from '@/components/ComiteUserRedirect'
import { requireAdminOrTesorero } from '@/lib/auth/permissions'

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

// Consultas paralelas para mejor rendimiento
async function getDashboardData(client: SupabaseClient<Database>): Promise<{ stats: DashboardStats; propositos: PropositoData[] }> {
  // Ejecutar consultas en paralelo
  const [propositosResult, statsResult] = await Promise.all([
    // Obtener solo los propósitos recientes necesarios para la vista
    client
      .from('propositos')
      .select('id, nombre, descripcion, monto_objetivo, monto_recaudado, estado, fecha_fin, fecha_inicio, created_at')
      .order('created_at', { ascending: false })
      .limit(10), // Solo los 10 más recientes
    
    // Obtener estadísticas agregadas
    client
      .from('propositos')
      .select('monto_objetivo, monto_recaudado, estado')
  ])

  if (propositosResult.error || statsResult.error) {
    console.error('Error al obtener datos del dashboard:', propositosResult.error || statsResult.error)
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

  // Calcular estadísticas desde los datos agregados
  const stats = (statsResult.data || []).reduce<DashboardStats>((acc, proposito) => {
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
    propositos: propositosResult.data || []
  }
}

// Componente principal del Dashboard  
export default async function DashboardPage() {
  // Verificar que el usuario sea admin o tesorero
  await requireAdminOrTesorero()
  
  try {
    const supabase = await createClient()
    const { stats, propositos } = await getDashboardData(supabase)

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
        {/* Componente para redirigir usuarios de comité */}
        <ComiteUserRedirect />
        
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

          {/* Progreso global - Componente optimizado */}
          <DashboardErrorBoundary>
            <ProgressSection stats={stats} />
          </DashboardErrorBoundary>

          {/* Resumen rápido - Componente optimizado */}
          <DashboardErrorBoundary>
            <QuickSummarySection stats={stats} />
          </DashboardErrorBoundary>

          {/* Propósitos recientes - Componente optimizado */}
          <DashboardErrorBoundary>
            <RecentPropositionsSection propositos={propositos} />
          </DashboardErrorBoundary>
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
