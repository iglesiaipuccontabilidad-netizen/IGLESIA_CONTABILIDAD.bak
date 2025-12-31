'use client'

import { ShoppingCart } from 'lucide-react'
import VentasVisualization from './VentasVisualization'

interface VentasPorProductoProps {
  datos: Array<{
    id: string
    producto_nombre: string
    producto_precio: number
    unidades_vendidas: number
    total_recaudado: number
    total_pendiente: number
    cantidad_ventas: number
    estado: 'activo' | 'inactivo'
  }>
  loading?: boolean
}

export default function VentasPorProducto({ datos, loading }: VentasPorProductoProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-slate-200 rounded-xl"></div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    )
  }

  if (!datos || datos.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-slate-600">No hay datos de ventas disponibles</p>
      </div>
    )
  }

  // Transformar datos al formato esperado por VentasVisualization
  const ventasTransformadas = datos.map(venta => ({
    producto_id: venta.id,
    nombre_producto: venta.producto_nombre,
    precio_unitario: venta.producto_precio,
    unidades_vendidas: venta.unidades_vendidas,
    total_recaudado: venta.total_recaudado,
    total_pendiente: venta.total_pendiente,
    total_ventas: venta.total_recaudado + venta.total_pendiente,
    num_ventas: venta.cantidad_ventas
  }))

  return <VentasVisualization ventas={ventasTransformadas} />
}
