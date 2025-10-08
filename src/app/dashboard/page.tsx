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
      .select('monto_total, recaudado')
      .eq('estado', 'activo')

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
        miembro:miembros!inner (
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
    ])    // Transformar los datos para los componentes
    const votosFormateados: Voto[] = votosRaw
      .filter((voto: VotoRaw): voto is (VotoRaw & { miembro: Required<MiembroVoto> }) => 
        Boolean(voto.miembro?.nombres && voto.miembro?.apellidos))
      .map((voto) => ({
        id: voto.id,
        proposito: voto.proposito,
        monto: voto.monto_total,
        recaudado: voto.recaudado ?? 0,
        fecha_limite: voto.fecha_limite,
        miembro: {
          nombres: voto.miembro.nombres,
          apellidos: voto.miembro.apellidos
        }
      }))

    return (
      <div className={styles.mainContainer}>
        <Suspense fallback={<div>Cargando estadísticas...</div>}>
          <DashboardCards
            totalComprometido={stats.total_comprometido}
            totalRecaudado={stats.total_recaudado}
            totalPendiente={stats.total_pendiente}
            votosActivos={stats.votos_activos}
          />
        </Suspense>
        <div className={styles.votosContainer}>
          <h2 className={styles.sectionTitle}>Votos Activos</h2>
          <Suspense fallback={<div>Cargando votos activos...</div>}>
            <VotosActivosTable votos={votosFormateados} />
          </Suspense>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error en el dashboard:', error)
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-600">
        Error al cargar el dashboard. Por favor, intenta recargar la página.
      </div>
    )
  }
}
