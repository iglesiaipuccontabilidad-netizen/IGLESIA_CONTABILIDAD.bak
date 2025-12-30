import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DatosProposito } from '@/hooks/useGraficosReportes'

interface GraficoPropositosProps {
  data: DatosProposito[]
  loading: boolean
}

export default function GraficoPropositos({ data, loading }: GraficoPropositosProps) {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recaudación por Propósito</h3>
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

  const chartData = data
    .sort((a, b) => b.recaudado - a.recaudado)
    .slice(0, 8) // Top 8 propósitos
    .map(item => ({
      nombre: item.nombre.length > 20 ? item.nombre.substring(0, 20) + '...' : item.nombre,
      comprometido: item.comprometido,
      recaudado: item.recaudado,
      pendiente: item.pendiente
    }))

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recaudación por Propósito</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="nombre"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis
            tickFormatter={formatCurrency}
            fontSize={12}
          />
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => [
              value ? formatCurrency(value) : '$0',
              name === 'comprometido' ? 'Comprometido' :
              name === 'recaudado' ? 'Recaudado' : 'Pendiente'
            ]}
            labelStyle={{ color: '#374151' }}
          />
          <Legend />
          <Bar dataKey="comprometido" fill="#3B82F6" name="Comprometido" />
          <Bar dataKey="recaudado" fill="#10B981" name="Recaudado" />
          <Bar dataKey="pendiente" fill="#F59E0B" name="Pendiente" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}