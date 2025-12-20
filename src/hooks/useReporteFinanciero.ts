import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ReporteFinanciero {
  total_comprometido: number
  total_recaudado: number
  total_pendiente: number
  votos_activos: number
  votos_completados: number
  votos_vencidos: number
  total_miembros_activos: number
  promedio_por_miembro: number
}

interface FiltrosFinanciero {
  fechaInicio?: string
  fechaFin?: string
}

export function useReporteFinanciero(filtros: FiltrosFinanciero = {}) {
  const [data, setData] = useState<ReporteFinanciero | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReporteFinanciero = async () => {
      const supabase = createClient()
      try {
        setLoading(true)
        setError(null)

        // Consultar votos con pagos
        let queryVotos = supabase
          .from('votos')
          .select(`
            id,
            monto_total,
            estado,
            created_at,
            pagos(monto)
          `)

        if (filtros.fechaInicio) {
          queryVotos = queryVotos.gte('created_at', filtros.fechaInicio)
        }

        if (filtros.fechaFin) {
          queryVotos = queryVotos.lte('created_at', filtros.fechaFin)
        }

        const { data: votos, error: votosError } = await queryVotos

        if (votosError) throw votosError

        // Consultar miembros activos
        const { count: miembrosActivos, error: miembrosError } = await supabase
          .from('miembros')
          .select('id', { count: 'exact', head: true })
          .eq('estado', 'activo')

        if (miembrosError) throw miembrosError

        // Calcular métricas
        let totalComprometido = 0
        let totalRecaudado = 0
        let votosActivosCount = 0
        let votosCompletadosCount = 0
        let votosVencidosCount = 0

        votos?.forEach((voto: any) => {
          const montoTotal = Number(voto.monto_total) || 0
          const pagosTotal = voto.pagos?.reduce((sum: number, pago: any) => 
            sum + Number(pago.monto), 0
          ) || 0

          totalComprometido += montoTotal
          totalRecaudado += pagosTotal

          if (voto.estado === 'activo') votosActivosCount++
          else if (voto.estado === 'completado') votosCompletadosCount++
          else if (voto.estado === 'vencido') votosVencidosCount++
        })

        const totalPendiente = totalComprometido - totalRecaudado
        const promedioporMiembro = miembrosActivos && miembrosActivos > 0
          ? totalComprometido / miembrosActivos
          : 0

        setData({
          total_comprometido: totalComprometido,
          total_recaudado: totalRecaudado,
          total_pendiente: totalPendiente,
          votos_activos: votosActivosCount,
          votos_completados: votosCompletadosCount,
          votos_vencidos: votosVencidosCount,
          total_miembros_activos: miembrosActivos || 0,
          promedio_por_miembro: promedioporMiembro
        })
      } catch (err: any) {
        console.error('Error al cargar reporte financiero:', err)
        setError(err.message || 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchReporteFinanciero()
  }, [filtros.fechaInicio, filtros.fechaFin])

  return { data, loading, error }
}
