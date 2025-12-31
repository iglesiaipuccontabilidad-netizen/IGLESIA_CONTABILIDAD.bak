'use client'

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  total_comprometido: number
  total_recaudado: number
  total_pendiente: number
  propositos_activos: number
  propositos_completados: number
  propositos_cancelados: number
  progreso_general: number
}

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

interface DashboardData {
  stats: DashboardStats
  propositos: PropositoData[]
}

async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createClient()
  
  // Ejecutar consultas en paralelo
  const [propositosResult, statsResult] = await Promise.all([
    supabase
      .from('propositos')
      .select('id, nombre, descripcion, monto_objetivo, monto_recaudado, estado, fecha_fin, fecha_inicio, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    
    supabase
      .from('propositos')
      .select('monto_objetivo, monto_recaudado, estado')
  ])

  if (propositosResult.error || statsResult.error) {
    throw new Error('Error al obtener datos del dashboard')
  }

  // Calcular estadísticas
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

export function useDashboardData(options?: Omit<UseQueryOptions<DashboardData>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 30, // 30 segundos
    gcTime: 1000 * 60 * 5, // 5 minutos
    ...options
  })
}

// Hook para propósitos con paginación
export function usePropositos(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['propositos', page, limit],
    queryFn: async () => {
      const supabase = createClient()
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await supabase
        .from('propositos')
        .select('id, nombre, descripcion, monto_objetivo, monto_recaudado, estado, fecha_fin, fecha_inicio, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      return {
        propositos: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      }
    },
    staleTime: 1000 * 30,
  })
}
