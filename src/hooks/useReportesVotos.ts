import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/dateFormatters'

export interface VotoReporte {
  id: string
  proposito: string
  monto_total: number
  recaudado: number
  pendiente: number
  estado: string
  fecha_limite: string
  miembro_nombre: string
  miembro_email: string
  created_at: string
}

interface FiltrosVotos {
  busqueda?: string
  estado?: string
  fechaInicio?: string
  fechaFin?: string
  miembroId?: string
  propositoId?: string
}

export function useReportesVotos(filtros: FiltrosVotos = {}) {
  const [data, setData] = useState<VotoReporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extraer las propiedades individuales del objeto filtros para evitar problemas de referencia
  const { busqueda, estado, fechaInicio, fechaFin, miembroId, propositoId } = filtros

  useEffect(() => {
    const fetchVotos = async () => {
      const supabase = createClient()
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('votos')
          .select(`
            id,
            proposito,
            monto_total,
            estado,
            fecha_limite,
            created_at,
            miembro:miembros(
              id,
              nombres,
              apellidos,
              email
            ),
            proposito_relacionado:propositos!inner(
              id,
              nombre
            ),
            pagos(monto)
          `)
          .order('created_at', { ascending: false })

        // Aplicar filtros
        if (estado) {
          query = query.eq('estado', estado)
        }

        if (fechaInicio) {
          query = query.gte('created_at', fechaInicio)
        }

        if (fechaFin) {
          query = query.lte('created_at', fechaFin)
        }

        if (miembroId) {
          query = query.eq('miembro_id', miembroId)
        }

        if (propositoId) {
          query = query.eq('proposito_id', propositoId)
        }

        const { data: votos, error: queryError } = await query

        if (queryError) throw queryError

        // Procesar datos
        const votosFormateados: VotoReporte[] = (votos || []).map((voto: any) => {
          const totalPagado = voto.pagos?.reduce((sum: number, pago: any) => sum + Number(pago.monto), 0) || 0
          const montoTotal = Number(voto.monto_total) || 0
          
          return {
            id: voto.id,
            proposito: voto.proposito_relacionado?.nombre || 'Sin propósito',
            monto_total: montoTotal,
            recaudado: totalPagado,
            pendiente: montoTotal - totalPagado,
            estado: voto.estado || 'activo',
            fecha_limite: formatDate(voto.fecha_limite),
            miembro_nombre: voto.miembro ? `${voto.miembro.nombres} ${voto.miembro.apellidos}` : 'Sin asignar',
            miembro_email: voto.miembro?.email || '',
            created_at: formatDate(voto.created_at)
          }
        })

        // Filtrar por búsqueda (nombre o propósito)
        let resultado = votosFormateados
        if (busqueda) {
          const busquedaLower = busqueda.toLowerCase()
          resultado = votosFormateados.filter(voto =>
            voto.miembro_nombre.toLowerCase().includes(busquedaLower) ||
            voto.proposito.toLowerCase().includes(busquedaLower)
          )
        }

        setData(resultado)
      } catch (err: any) {
        console.error('Error al cargar votos:', err)
        setError(err.message || 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchVotos()
  }, [busqueda, estado, fechaInicio, fechaFin, miembroId, propositoId])

  return { data, loading, error }
}
