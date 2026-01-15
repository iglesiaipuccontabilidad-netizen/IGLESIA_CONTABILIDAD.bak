import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface MiembroReporte {
  id: string
  nombre_completo: string
  email: string
  telefono: string | null
  votos_activos: number
  votos_completados: number
  total_comprometido: number
  total_pagado: number
  total_pendiente: number
  estado: string
}

interface FiltrosMiembros {
  busqueda?: string
  estado?: string
}

export function useReportesMiembros(filtros: FiltrosMiembros = {}) {
  const [data, setData] = useState<MiembroReporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extraer las propiedades individuales del objeto filtros para evitar problemas de referencia
  const { busqueda, estado } = filtros

  useEffect(() => {
    const fetchMiembros = async () => {
      const supabase = createClient()
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('miembros')
          .select(`
            id,
            nombres,
            apellidos,
            email,
            telefono,
            estado,
            votos(
              id,
              monto_total,
              estado,
              pagos(monto)
            )
          `)
          .order('nombres', { ascending: true })

        // Aplicar filtro de estado
        if (estado) {
          query = query.eq('estado', estado)
        }

        const { data: miembros, error: queryError } = await query

        if (queryError) throw queryError

        // Procesar datos
        const miembrosFormateados: MiembroReporte[] = (miembros || []).map((miembro: any) => {
          const votos = miembro.votos || []
          const votosActivos = votos.filter((v: any) => v.estado === 'activo').length
          const votosCompletados = votos.filter((v: any) => v.estado === 'completado').length
          
          const totalComprometido = votos.reduce((sum: number, voto: any) => 
            sum + (Number(voto.monto_total) || 0), 0
          )
          
          const totalPagado = votos.reduce((sum: number, voto: any) => {
            const pagosVoto = voto.pagos?.reduce((s: number, p: any) => s + Number(p.monto), 0) || 0
            return sum + pagosVoto
          }, 0)

          return {
            id: miembro.id,
            nombre_completo: `${miembro.nombres} ${miembro.apellidos}`,
            email: miembro.email || '',
            telefono: miembro.telefono,
            votos_activos: votosActivos,
            votos_completados: votosCompletados,
            total_comprometido: totalComprometido,
            total_pagado: totalPagado,
            total_pendiente: totalComprometido - totalPagado,
            estado: miembro.estado || 'activo'
          }
        })

        // Filtrar por búsqueda
        let resultado = miembrosFormateados
        if (busqueda) {
          const busquedaLower = busqueda.toLowerCase()
          resultado = miembrosFormateados.filter(miembro =>
            miembro.nombre_completo.toLowerCase().includes(busquedaLower) ||
            miembro.email.toLowerCase().includes(busquedaLower)
          )
        }

        setData(resultado)
      } catch (err: any) {
        console.error('Error al cargar miembros:', err)
        setError(err.message || 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    fetchMiembros()
  }, [busqueda, estado])

  return { data, loading, error }
}
