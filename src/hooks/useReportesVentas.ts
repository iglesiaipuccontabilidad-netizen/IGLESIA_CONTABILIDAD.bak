'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface VentaProductoReporte {
  id: string
  producto_nombre: string
  producto_precio: number
  unidades_vendidas: number
  total_recaudado: number
  total_pendiente: number
  cantidad_ventas: number
  estado: 'activo' | 'inactivo'
}

interface UseReportesVentasProps {
  proyectoId?: string
  busqueda?: string
  fechaInicio?: string
  fechaFin?: string
}

export function useReportesVentas({ 
  proyectoId,
  busqueda = '', 
  fechaInicio = '', 
  fechaFin = '' 
}: UseReportesVentasProps = {}) {
  const [datos, setDatos] = useState<VentaProductoReporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReporteVentas()
  }, [proyectoId, busqueda, fechaInicio, fechaFin])

  const fetchReporteVentas = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      // Construir query base
      let query = supabase
        .from('proyecto_productos')
        .select(`
          id,
          nombre,
          precio_unitario,
          estado,
          proyecto_ventas (
            cantidad,
            valor_total,
            monto_pagado,
            saldo_pendiente,
            fecha_venta,
            estado
          )
        `)
        .order('nombre', { ascending: true })

      // Filtro por proyecto (si se especifica)
      if (proyectoId) {
        query = query.eq('proyecto_id', proyectoId)
      }

      // Ejecutar query
      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Procesar datos y agrupar por producto
      const reporteAgrupado = (data || []).map((producto: any) => {
        // Filtrar ventas según criterios
        let ventasFiltradas = producto.proyecto_ventas || []

        // Filtrar por búsqueda (nombre del producto)
        if (busqueda.trim()) {
          const searchLower = busqueda.toLowerCase()
          if (!producto.nombre.toLowerCase().includes(searchLower)) {
            ventasFiltradas = []
          }
        }

        // Filtrar por rango de fechas
        if (fechaInicio || fechaFin) {
          ventasFiltradas = ventasFiltradas.filter((venta: any) => {
            const fechaVenta = new Date(venta.fecha_venta)
            
            if (fechaInicio) {
              const inicio = new Date(fechaInicio)
              if (fechaVenta < inicio) return false
            }
            
            if (fechaFin) {
              const fin = new Date(fechaFin)
              if (fechaVenta > fin) return false
            }
            
            return true
          })
        }

        // Filtrar solo ventas no canceladas
        ventasFiltradas = ventasFiltradas.filter((v: any) => v.estado !== 'cancelado')

        // Calcular totales
        const unidades = ventasFiltradas.reduce((sum: number, v: any) => sum + (v.cantidad || 0), 0)
        const recaudado = ventasFiltradas.reduce((sum: number, v: any) => sum + (v.monto_pagado || 0), 0)
        const pendiente = ventasFiltradas.reduce((sum: number, v: any) => sum + (v.saldo_pendiente || 0), 0)

        return {
          id: producto.id,
          producto_nombre: producto.nombre,
          producto_precio: producto.precio_unitario,
          unidades_vendidas: unidades,
          total_recaudado: recaudado,
          total_pendiente: pendiente,
          cantidad_ventas: ventasFiltradas.length,
          estado: producto.estado
        }
      })

      // Filtrar productos sin ventas si no hay búsqueda activa
      const reporteFinal = busqueda.trim() 
        ? reporteAgrupado 
        : reporteAgrupado.filter((p: VentaProductoReporte) => p.cantidad_ventas > 0)

      setDatos(reporteFinal)
    } catch (err: any) {
      console.error('Error al cargar reporte de ventas:', err)
      setError(err.message || 'Error al cargar datos')
      setDatos([])
    } finally {
      setLoading(false)
    }
  }

  return { datos, loading, error, refetch: fetchReporteVentas }
}
