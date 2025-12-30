import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { DatosEstadoVotos } from '@/hooks/useGraficosReportes'

interface GraficoEstadoVotosProps {
  data: DatosEstadoVotos[]
  loading: boolean
}

const COLORS = {
  Activo: '#10B981',    // green
  Completado: '#3B82F6', // blue
  Vencido: '#EF4444',   // red
  Pendiente: '#F59E0B'  // yellow
}

export default function GraficoEstadoVotos({ data, loading }: GraficoEstadoVotosProps) {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Votos</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No hay datos disponibles
        </div>
      </div>
    )
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // No mostrar labels para porcentajes menores al 5%

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Votos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.estado as keyof typeof COLORS] || '#6B7280'}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => [
              value ? `${value} votos (${data.find(d => d.estado === name)?.porcentaje.toFixed(1)}%)` : '0 votos',
              'Cantidad'
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>
                {value} ({data.find(d => d.estado === value)?.count || 0})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}