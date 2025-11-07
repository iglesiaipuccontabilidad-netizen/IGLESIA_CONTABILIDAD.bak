import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import DashboardCards from '@/components/dashboard/DashboardCards'
import VotosActivosTable from '@/components/dashboard/VotosActivosTable'
import styles from '@/styles/dashboard.module.css'
import { Voto } from '@/types/dashboard'
import { Database } from '@/lib/database.types'

interface DashboardStats {
  total_comprometido: number
  total_recaudado: number
  total_pendiente: number
  votos_activos: number
}

// Interfaz para el miembro en los votos
interface MiembroVoto {
  id: string
  nombres: string
  apellidos: string
  cedula: string
  estado: 'activo' | 'inactivo'
}

interface VotoRaw {
  id: string
  proposito: string
  monto_total: number
  recaudado: number | null
  fecha_limite: string
  estado: 'activo' | 'completado' | 'cancelado'
  created_at: string
  updated_at: string
  miembro: MiembroVoto
}

// Configuración de la página
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Función para obtener las estadísticas del dashboard
async function getDashboardStats(client: SupabaseClient<Database>): Promise<DashboardStats> {
  try {
    // Query votos activos y sus totales
    const { data: votosActivos, error: votosError } = await client
      .from('votos')
      .select(`
        id,
        proposito,
        monto_total,
        recaudado,
        fecha_limite,
        estado,
        miembro:miembros (
          id,
          nombres,
          apellidos,
          cedula,
          estado
        )
      `)
      .eq('estado', 'activo')
      .order('fecha_limite', { ascending: true })

    if (votosError) {
      throw votosError
    }

    // Calcular totales
    const totales = votosActivos.reduce(
      (acc: { total_comprometido: number; total_recaudado: number }, voto: { monto_total: number; recaudado: number }) => {
        return {
          total_comprometido: acc.total_comprometido + voto.monto_total,
          total_recaudado: acc.total_recaudado + (voto.recaudado || 0)
        }
      },
      { total_comprometido: 0, total_recaudado: 0 }
    )

    return {
      total_comprometido: totales.total_comprometido,
      total_recaudado: totales.total_recaudado,
      total_pendiente: totales.total_comprometido - totales.total_recaudado,
      votos_activos: votosActivos.length
    }
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return {
      total_comprometido: 0,
      total_recaudado: 0,
      total_pendiente: 0,
      votos_activos: 0
    }
  }
}

// Función para obtener los votos activos
async function getVotosActivos(client: SupabaseClient<Database>): Promise<VotoRaw[]> {
    const { data, error } = await client
      .from('votos')
      .select(`
        id,
        proposito,
        monto_total,
        recaudado,
        fecha_limite,
        estado,
        created_at,
        updated_at,
        miembro:miembros (
          id,
          nombres,
          apellidos,
          cedula,
          estado
        )
      `)
      .eq('estado', 'activo')

    if (error) {
      console.error('Error al obtener votos activos:', error)
      return []
    }

    return data || []
}

// Componente principal del Dashboard  
export default async function DashboardPage() {
  try {
    const supabase = await createClient()
    
    // Obtener estadísticas y votos activos en paralelo  
    const [stats, votosRaw] = await Promise.all([
      getDashboardStats(supabase),
      getVotosActivos(supabase)
    ])

    // Transformar los datos para la tabla de votos
    const votosFormateados: Voto[] = votosRaw.map((voto) => ({
      id: voto.id,
      proposito: voto.proposito,
      monto: voto.monto_total,
      recaudado: voto.recaudado ?? 0,
      fecha_limite: voto.fecha_limite,
      miembro: voto.miembro ? {
        nombres: voto.miembro.nombres,
        apellidos: voto.miembro.apellidos
      } : {
        nombres: 'No',
        apellidos: 'Asignado'
      }
    }))

    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-cyan-50 to-blue-50 relative overflow-hidden">
        {/* Decoraciones de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-violet-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container-custom py-8 space-y-8 animate-fade-in relative z-10">
          {/* Header del Dashboard */}
          <div className="page-header">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-slate-600 mt-2 flex items-center space-x-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Resumen general de votos y compromisos financieros</span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-200 shadow-sm">
                <span className="text-xs text-violet-600 font-medium">
                  Última actualización: {new Date().toLocaleDateString('es-CO', { 
                    day: 'numeric', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
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
              votosActivos={stats.votos_activos}
            />
          </Suspense>
          
          {/* Sección de Votos Activos */}
          <Suspense fallback={
            <div className="card p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          }>
            <VotosActivosTable votos={votosFormateados} />
          </Suspense>
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
