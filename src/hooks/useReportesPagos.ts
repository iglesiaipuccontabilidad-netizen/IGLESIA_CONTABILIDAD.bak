import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/dateFormatters'

export interface PagoReporte {
  id: string
  monto: number
  fecha_pago: string
  metodo_pago: string
  nota: string | null
  voto_proposito: string
  miembro_nombre: string
  miembro_email: string
}

interface FiltrosPagos {
  busqueda?: string
  fechaInicio?: string
  fechaFin?: string
  metodoPago?: string
  miembroId?: string
  propositoId?: string
}

export function useReportesPagos(filtros: FiltrosPagos = {}) {
  const [data, setData] = useState<PagoReporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extraer las propiedades individuales del objeto filtros para evitar problemas de referencia
  const { busqueda, fechaInicio, fechaFin, metodoPago, miembroId, propositoId } = filtros

  useEffect(() => {
    const fetchPagos = async () => {
      const supabase = createClient()
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('pagos')
          .select(`
            id,
            monto,
            fecha_pago,
            metodo_pago,
            nota,
            voto:votos!inner(
              proposito,
              miembro:miembros!inner(
                nombres,
                apellidos,
                email
              )
            )
          `)
          .order('fecha_pago', { ascending: false })

        // Aplicar filtros de fecha
        if (fechaInicio) {
          query = query.gte('fecha_pago', fechaInicio)
        }

        if (fechaFin) {
          query = query.lte('fecha_pago', fechaFin)
        }

        if (metodoPago) {
          query = query.eq('metodo_pago', metodoPago)
        }

        if (propositoId) {
          query = query.eq('voto.proposito_id', propositoId)
        }

        const { data: pagos, error: queryError } = await query

        if (queryError) throw queryError

        // Procesar datos
        const pagosFormateados: PagoReporte[] = (pagos || []).map((pago: any) => ({
          id: pago.id,
          monto: Number(pago.monto) || 0,
          fecha_pago: formatDate(pago.fecha_pago),
          metodo_pago: pago.metodo_pago || 'efectivo',
          nota: pago.nota,
          voto_proposito: pago.voto?.proposito || 'Sin propósito',
          miembro_nombre: pago.voto?.miembro 
            ? `${pago.voto.miembro.nombres} ${pago.voto.miembro.apellidos}`
            : 'Sin asignar',
          miembro_email: pago.voto?.miembro?.email || ''
        }))

        // Filtrar por búsqueda
        let resultado = pagosFormateados
        if (busqueda) {
          const busquedaLower = busqueda.toLowerCase()
          resultado = pagosFormateados.filter(pago =>
            pago.miembro_nombre.toLowerCase().includes(busquedaLower) ||
            pago.voto_proposito.toLowerCase().includes(busquedaLower)
          )
        }

        setData(resultado)
      } catch (err: any) {
        console.error('Error al cargar pagos:', err)
        setError(err.message || 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchPagos()
  }, [busqueda, fechaInicio, fechaFin, metodoPago, miembroId, propositoId])

  return { data, loading, error }
}
