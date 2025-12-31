'use client';

import { Package, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface VentaProducto {
  producto_id: string;
  nombre_producto: string;
  precio_unitario: number;
  unidades_vendidas: number;
  total_recaudado: number;
  total_pendiente: number;
  total_ventas: number;
  num_ventas: number;
}

interface VentasVisualizationProps {
  ventas: VentaProducto[];
}

export default function VentasVisualization({ ventas }: VentasVisualizationProps) {
  if (!ventas || ventas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Package className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">No hay ventas registradas para este período</p>
      </div>
    );
  }

  // Calcular totales generales
  const totales = ventas.reduce(
    (acc, venta) => ({
      recaudado: acc.recaudado + venta.total_recaudado,
      pendiente: acc.pendiente + venta.total_pendiente,
      ventas: acc.ventas + venta.total_ventas,
      numVentas: acc.numVentas + venta.num_ventas,
    }),
    { recaudado: 0, pendiente: 0, ventas: 0, numVentas: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totales.ventas)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recaudado</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totales.recaudado)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendiente</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(totales.pendiente)}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transacciones</p>
              <p className="text-2xl font-bold text-blue-600">
                {totales.numVentas}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Título de Sección */}
      <div className="flex items-center gap-2 pt-4">
        <h3 className="text-xl font-semibold text-gray-800">Ventas por Producto</h3>
      </div>

      {/* Lista de Productos */}
      <div className="space-y-4">
        {ventas.map((venta) => {
          const porcentajeRecaudado = venta.total_ventas > 0 
            ? (venta.total_recaudado / venta.total_ventas) * 100 
            : 0;

          return (
            <div 
              key={venta.producto_id} 
              className="border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-white"
            >
              {/* Encabezado del Producto */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6 text-white" />
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {venta.nombre_producto}
                      </h4>
                      <p className="text-sm text-purple-100">
                        {formatCurrency(venta.precio_unitario)} c/u
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(venta.total_ventas)}
                    </p>
                    <p className="text-sm text-purple-100">{venta.num_ventas} ventas</p>
                  </div>
                </div>
              </div>

              {/* Detalles del Producto */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Unidades */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Unidades</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {venta.unidades_vendidas}
                    </p>
                  </div>

                  {/* Recaudado */}
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Recaudado</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(venta.total_recaudado)}
                    </p>
                    <div className="mt-2">
                      <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-600 transition-all duration-300"
                          style={{ width: `${porcentajeRecaudado}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {porcentajeRecaudado.toFixed(1)}% del total
                      </p>
                    </div>
                  </div>

                  {/* Pendiente */}
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-600 mb-1">Pendiente</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(venta.total_pendiente)}
                    </p>
                    {venta.total_pendiente > 0 && (
                      <div className="flex items-center justify-center gap-1 mt-2 text-orange-600">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-xs">Saldo por cobrar</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
