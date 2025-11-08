import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
}

export function useReportesPagos(filtros: FiltrosPagos = {}) {
  const [data, setData] = useState<PagoReporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchPagos = async () => {
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
        if (filtros.fechaInicio) {
          query = query.gte('fecha_pago', filtros.fechaInicio)
        }

        if (filtros.fechaFin) {
          query = query.lte('fecha_pago', filtros.fechaFin)
        }

        if (filtros.metodoPago) {
          query = query.eq('metodo_pago', filtros.metodoPago)
        }

        const { data: pagos, error: queryError } = await query

        if (queryError) throw queryError

        // Procesar datos
        const pagosFormateados: PagoReporte[] = (pagos || []).map((pago: any) => ({
          id: pago.id,
          monto: Number(pago.monto) || 0,
          fecha_pago: pago.fecha_pago,
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
        if (filtros.busqueda) {
          const busqueda = filtros.busqueda.toLowerCase()
          resultado = pagosFormateados.filter(pago =>
            pago.miembro_nombre.toLowerCase().includes(busqueda) ||
            pago.voto_proposito.toLowerCase().includes(busqueda)
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
  }, [filtros.busqueda, filtros.fechaInicio, filtros.fechaFin, filtros.metodoPago, filtros.miembroId])

  return { data, loading, error }
}
