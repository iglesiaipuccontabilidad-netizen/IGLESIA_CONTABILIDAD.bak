import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ReporteFinanciero {
  // Métricas básicas
  total_comprometido: number
  total_recaudado: number
  total_pendiente: number
  votos_activos: number
  votos_completados: number
  votos_vencidos: number
  total_miembros_activos: number
  promedio_por_miembro: number

  // Métricas avanzadas
  porcentaje_cumplimiento: number
  promedio_por_voto: number
  total_votos: number
  eficiencia_recaudacion: number
  tasa_vencimiento: number
  crecimiento_mensual: number

  // Análisis por períodos
  recaudacion_mes_actual: number
  recaudacion_mes_anterior: number
  variacion_mensual: number

  // Distribución por rangos
  votos_pequenos: number // < $500,000
  votos_medianos: number // $500,000 - $2,000,000
  votos_grandes: number // > $2,000,000

  // Top contribuyentes
  top_miembros: Array<{
    nombre: string
    total_comprometido: number
    total_recaudado: number
    porcentaje_cumplimiento: number
  }>

  // Análisis por propósito
  analisis_propositos: Array<{
    nombre: string
    total_comprometido: number
    total_recaudado: number
    votos_count: number
    porcentaje_avance: number
  }>

  // Tendencias
  tendencia_recaudacion: Array<{
    mes: string
    year: number
    recaudado: number
    comprometido: number
  }>
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

        // Obtener fecha actual y anterior
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

        // Consultar votos con pagos y propósitos
        let queryVotos = supabase
          .from('votos')
          .select(`
            id,
            monto_total,
            estado,
            created_at,
            fecha_limite,
            miembro:miembros!inner(
              id,
              nombres,
              apellidos
            ),
            proposito:propositos!inner(
              nombre
            ),
            pagos(monto, fecha_pago)
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

        // Procesar datos
        let totalComprometido = 0
        let totalRecaudado = 0
        let votosActivosCount = 0
        let votosCompletadosCount = 0
        let votosVencidosCount = 0
        let recaudacionMesActual = 0
        let recaudacionMesAnterior = 0

        // Contadores por rangos
        let votosPequenos = 0
        let votosMedianos = 0
        let votosGrandes = 0

        // Mapas para análisis
        const miembrosMap = new Map<string, {
          nombre: string
          comprometido: number
          recaudado: number
        }>()

        const propositosMap = new Map<string, {
          comprometido: number
          recaudado: number
          votos: number
        }>()

        const tendenciaMap = new Map<string, {
          comprometido: number
          recaudado: number
        }>()

        votos?.forEach((voto: any) => {
          const montoTotal = Number(voto.monto_total) || 0
          const pagosTotal = voto.pagos?.reduce((sum: number, pago: any) => {
            const pagoMonto = Number(pago.monto) || 0
            const fechaPago = new Date(pago.fecha_pago)

            // Acumular por mes para tendencias
            const mesKey = `${fechaPago.getFullYear()}-${String(fechaPago.getMonth() + 1).padStart(2, '0')}`
            if (!tendenciaMap.has(mesKey)) {
              tendenciaMap.set(mesKey, { comprometido: 0, recaudado: 0 })
            }
            tendenciaMap.get(mesKey)!.recaudado += pagoMonto

            // Verificar mes actual vs anterior
            if (fechaPago.getMonth() === currentMonth && fechaPago.getFullYear() === currentYear) {
              recaudacionMesActual += pagoMonto
            } else if (fechaPago.getMonth() === lastMonth && fechaPago.getFullYear() === lastMonthYear) {
              recaudacionMesAnterior += pagoMonto
            }

            return sum + pagoMonto
          }, 0) || 0

          totalComprometido += montoTotal
          totalRecaudado += pagosTotal

          // Contar por estado
          if (voto.estado === 'activo') votosActivosCount++
          else if (voto.estado === 'completado') votosCompletadosCount++
          else if (voto.estado === 'vencido') votosVencidosCount++

          // Clasificar por rangos
          if (montoTotal < 500000) votosPequenos++
          else if (montoTotal <= 2000000) votosMedianos++
          else votosGrandes++

          // Agregar a mes de creación para tendencias
          const mesCreacion = new Date(voto.created_at).toISOString().substring(0, 7)
          if (!tendenciaMap.has(mesCreacion)) {
            tendenciaMap.set(mesCreacion, { comprometido: 0, recaudado: 0 })
          }
          tendenciaMap.get(mesCreacion)!.comprometido += montoTotal

          // Procesar miembros
          const miembroNombre = `${voto.miembro.nombres} ${voto.miembro.apellidos}`
          if (!miembrosMap.has(miembroNombre)) {
            miembrosMap.set(miembroNombre, { nombre: miembroNombre, comprometido: 0, recaudado: 0 })
          }
          miembrosMap.get(miembroNombre)!.comprometido += montoTotal
          miembrosMap.get(miembroNombre)!.recaudado += pagosTotal

          // Procesar propósitos
          const propositoNombre = voto.proposito?.nombre || 'Sin propósito'
          if (!propositosMap.has(propositoNombre)) {
            propositosMap.set(propositoNombre, { comprometido: 0, recaudado: 0, votos: 0 })
          }
          const proposito = propositosMap.get(propositoNombre)!
          proposito.comprometido += montoTotal
          proposito.recaudado += pagosTotal
          proposito.votos += 1
        })

        const totalPendiente = totalComprometido - totalRecaudado
        const totalVotos = votos?.length || 0

        // Calcular métricas avanzadas
        const porcentajeCumplimiento = totalComprometido > 0 ? (totalRecaudado / totalComprometido) * 100 : 0
        const promedioPorMiembro = miembrosActivos && miembrosActivos > 0 ? totalComprometido / miembrosActivos : 0
        const promedioPorVoto = totalVotos > 0 ? totalComprometido / totalVotos : 0
        const eficienciaRecaudacion = totalComprometido > 0 ? (totalRecaudado / totalComprometido) * 100 : 0
        const tasaVencimiento = totalVotos > 0 ? (votosVencidosCount / totalVotos) * 100 : 0

        // Calcular variación mensual
        const variacionMensual = recaudacionMesAnterior > 0
          ? ((recaudacionMesActual - recaudacionMesAnterior) / recaudacionMesAnterior) * 100
          : 0

        // Calcular crecimiento mensual (basado en tendencia)
        const mesesOrdenados = Array.from(tendenciaMap.keys()).sort()
        const crecimientoMensual = mesesOrdenados.length >= 2
          ? (() => {
              const ultimo = mesesOrdenados[mesesOrdenados.length - 1]
              const penultimo = mesesOrdenados[mesesOrdenados.length - 2]
              const ultimoValor = tendenciaMap.get(ultimo)?.recaudado || 0
              const penultimoValor = tendenciaMap.get(penultimo)?.recaudado || 0
              return penultimoValor > 0 ? ((ultimoValor - penultimoValor) / penultimoValor) * 100 : 0
            })()
          : 0

        // Top miembros
        const topMiembros = Array.from(miembrosMap.values())
          .map(m => ({
            nombre: m.nombre,
            total_comprometido: m.comprometido,
            total_recaudado: m.recaudado,
            porcentaje_cumplimiento: m.comprometido > 0 ? (m.recaudado / m.comprometido) * 100 : 0
          }))
          .sort((a, b) => b.total_comprometido - a.total_comprometido)
          .slice(0, 10)

        // Análisis por propósitos
        const analisisPropositos = Array.from(propositosMap.entries())
          .map(([nombre, data]) => ({
            nombre,
            total_comprometido: data.comprometido,
            total_recaudado: data.recaudado,
            votos_count: data.votos,
            porcentaje_avance: data.comprometido > 0 ? (data.recaudado / data.comprometido) * 100 : 0
          }))
          .sort((a, b) => b.total_comprometido - a.total_comprometido)

        // Tendencia de recaudación
        const tendenciaRecaudacion = mesesOrdenados
          .slice(-12) // Últimos 12 meses
          .map(mesKey => {
            const [year, month] = mesKey.split('-')
            const fecha = new Date(parseInt(year), parseInt(month) - 1)
            const data = tendenciaMap.get(mesKey) || { comprometido: 0, recaudado: 0 }
            return {
              mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
              year: parseInt(year),
              comprometido: data.comprometido,
              recaudado: data.recaudado
            }
          })

        setData({
          // Métricas básicas
          total_comprometido: totalComprometido,
          total_recaudado: totalRecaudado,
          total_pendiente: totalPendiente,
          votos_activos: votosActivosCount,
          votos_completados: votosCompletadosCount,
          votos_vencidos: votosVencidosCount,
          total_miembros_activos: miembrosActivos || 0,
          promedio_por_miembro: promedioPorMiembro,

          // Métricas avanzadas
          porcentaje_cumplimiento: porcentajeCumplimiento,
          promedio_por_voto: promedioPorVoto,
          total_votos: totalVotos,
          eficiencia_recaudacion: eficienciaRecaudacion,
          tasa_vencimiento: tasaVencimiento,
          crecimiento_mensual: crecimientoMensual,

          // Análisis por períodos
          recaudacion_mes_actual: recaudacionMesActual,
          recaudacion_mes_anterior: recaudacionMesAnterior,
          variacion_mensual: variacionMensual,

          // Distribución por rangos
          votos_pequenos: votosPequenos,
          votos_medianos: votosMedianos,
          votos_grandes: votosGrandes,

          // Top contribuyentes
          top_miembros: topMiembros,

          // Análisis por propósito
          analisis_propositos: analisisPropositos,

          // Tendencias
          tendencia_recaudacion: tendenciaRecaudacion
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
