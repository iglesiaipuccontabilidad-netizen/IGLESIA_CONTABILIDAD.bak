import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DatosTendenciaPagos } from '@/hooks/useGraficosReportes'

interface GraficoTendenciaPagosProps {
  data: DatosTendenciaPagos[]
  loading: boolean
}

export default function GraficoTendenciaPagos({ data, loading }: GraficoTendenciaPagosProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Pagos</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No hay datos disponibles
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia de Pagos Mensuales</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="mes"
            fontSize={12}
          />
          <YAxis
            tickFormatter={formatCurrency}
            fontSize={12}
          />
          <Tooltip
            formatter={(value: number | undefined) => [value ? formatCurrency(value) : '$0', 'Total Pagos']}
            labelStyle={{ color: '#374151' }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#10B981"
            strokeWidth={3}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}