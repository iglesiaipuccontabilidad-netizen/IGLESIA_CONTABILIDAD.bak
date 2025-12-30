import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DatosProposito {
  nombre: string
  comprometido: number
  recaudado: number
  pendiente: number
  votos_count: number
}

export interface DatosEstadoVotos {
  estado: string
  count: number
  porcentaje: number
}

export interface DatosTendenciaPagos {
  mes: string
  year: number
  total: number
}

interface FiltrosGraficos {
  fechaInicio?: string
  fechaFin?: string
}

export function useGraficosReportes(filtros: FiltrosGraficos = {}) {
  const [datosPropositos, setDatosPropositos] = useState<DatosProposito[]>([])
  const [datosEstadoVotos, setDatosEstadoVotos] = useState<DatosEstadoVotos[]>([])
  const [datosTendenciaPagos, setDatosTendenciaPagos] = useState<DatosTendenciaPagos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDatosGraficos = async () => {
      const supabase = createClient()
      try {
        setLoading(true)
        setError(null)

        // Datos por propósito
        let queryPropositos = supabase
          .from('votos')
          .select(`
            proposito_id,
            monto_total,
            pagos(monto),
            propositos(nombre)
          `)

        if (filtros.fechaInicio) {
          queryPropositos = queryPropositos.gte('created_at', filtros.fechaInicio)
        }

        if (filtros.fechaFin) {
          queryPropositos = queryPropositos.lte('created_at', filtros.fechaFin)
        }

        const { data: votosPropositos, error: propositosError } = await queryPropositos

        if (propositosError) throw propositosError

        // Agrupar por propósito
        const propositosMap = new Map<string, DatosProposito>()

        votosPropositos?.forEach((voto: any) => {
          const nombre = voto.propositos?.nombre || 'Sin propósito'
          const comprometido = Number(voto.monto_total) || 0
          const recaudado = voto.pagos?.reduce((sum: number, pago: any) =>
            sum + Number(pago.monto), 0
          ) || 0

          if (propositosMap.has(nombre)) {
            const existing = propositosMap.get(nombre)!
            existing.comprometido += comprometido
            existing.recaudado += recaudado
            existing.votos_count += 1
          } else {
            propositosMap.set(nombre, {
              nombre,
              comprometido,
              recaudado,
              pendiente: comprometido - recaudado,
              votos_count: 1
            })
          }
        })

        setDatosPropositos(Array.from(propositosMap.values()))

        // Datos de estado de votos
        let queryEstados = supabase
          .from('votos')
          .select('estado')

        if (filtros.fechaInicio) {
          queryEstados = queryEstados.gte('created_at', filtros.fechaInicio)
        }

        if (filtros.fechaFin) {
          queryEstados = queryEstados.lte('created_at', filtros.fechaFin)
        }

        const { data: votosEstados, error: estadosError } = await queryEstados

        if (estadosError) throw estadosError

        const estadosCount: Record<string, number> = votosEstados?.reduce((acc: Record<string, number>, voto: any) => {
          acc[voto.estado] = (acc[voto.estado] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        const totalVotos = Object.values(estadosCount).reduce((sum, count) => sum + count, 0)

        const estadosData: DatosEstadoVotos[] = Object.entries(estadosCount).map(([estado, count]) => ({
          estado: estado.charAt(0).toUpperCase() + estado.slice(1),
          count,
          porcentaje: totalVotos > 0 ? (count / totalVotos) * 100 : 0
        }))

        setDatosEstadoVotos(estadosData)

        // Tendencia de pagos por mes
        let queryTendencia = supabase
          .from('pagos')
          .select('monto, fecha_pago')

        if (filtros.fechaInicio) {
          queryTendencia = queryTendencia.gte('fecha_pago', filtros.fechaInicio)
        }

        if (filtros.fechaFin) {
          queryTendencia = queryTendencia.lte('fecha_pago', filtros.fechaFin)
        }

        const { data: pagosTendencia, error: tendenciaError } = await queryTendencia

        if (tendenciaError) throw tendenciaError

        const tendenciaMap = new Map<string, number>()

        pagosTendencia?.forEach((pago: any) => {
          const fecha = new Date(pago.fecha_pago)
          const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
          const mesNombre = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })

          if (tendenciaMap.has(mesKey)) {
            tendenciaMap.set(mesKey, tendenciaMap.get(mesKey)! + Number(pago.monto))
          } else {
            tendenciaMap.set(mesKey, Number(pago.monto))
          }
        })

        const tendenciaData: DatosTendenciaPagos[] = Array.from(tendenciaMap.entries())
          .map(([key, total]) => {
            const [year, month] = key.split('-')
            const fecha = new Date(parseInt(year), parseInt(month) - 1)
            return {
              mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
              year: parseInt(year),
              total
            }
          })
          .sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year
            return a.mes.localeCompare(b.mes)
          })

        setDatosTendenciaPagos(tendenciaData)

      } catch (err: any) {
        console.error('Error al cargar datos gráficos:', err)
        setError(err.message || 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchDatosGraficos()
  }, [filtros.fechaInicio, filtros.fechaFin])

  return {
    datosPropositos,
    datosEstadoVotos,
    datosTendenciaPagos,
    loading,
    error
  }
}