import React from 'react'
import {
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Award,
  Activity
} from 'lucide-react'

interface DashboardFinancieroAvanzadoProps {
  data: any
  loading: boolean
}

export default function DashboardFinancieroAvanzado({ data, loading }: DashboardFinancieroAvanzadoProps) {
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // KPIs principales
  const kpisPrincipales = [
    {
      title: 'Total Comprometido',
      value: formatCurrency(data.total_comprometido),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: null
    },
    {
      title: 'Total Recaudado',
      value: formatCurrency(data.total_recaudado),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: data.variacion_mensual
    },
    {
      title: 'Total Pendiente',
      value: formatCurrency(data.total_pendiente),
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: null
    },
    {
      title: 'Cumplimiento Global',
      value: formatPercentage(data.porcentaje_cumplimiento),
      icon: Target,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: null
    }
  ]

  // KPIs secundarios
  const kpisSecundarios = [
    {
      title: 'Miembros Activos',
      value: data.total_miembros_activos.toString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Votos',
      value: data.total_votos.toString(),
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Promedio por Miembro',
      value: formatCurrency(data.promedio_por_miembro),
      icon: Activity,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    {
      title: 'Tasa de Vencimiento',
      value: formatPercentage(data.tasa_vencimiento),
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  // Distribución por rangos
  const distribucionRangos = [
    { label: 'Votos Pequeños (< $500K)', count: data.votos_pequenos, color: 'bg-blue-500' },
    { label: 'Votos Medianos ($500K - $2M)', count: data.votos_medianos, color: 'bg-green-500' },
    { label: 'Votos Grandes (> $2M)', count: data.votos_grandes, color: 'bg-purple-500' }
  ]

  return (
    <div className="space-y-8">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpisPrincipales.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                {kpi.trend !== null && (
                  <p className={`text-sm mt-1 ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.trend >= 0 ? '+' : ''}{kpi.trend.toFixed(1)}% vs mes anterior
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* KPIs Secundarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpisSecundarios.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
              </div>
              <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Distribución por Rangos */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-indigo-600" />
          Distribución de Votos por Rango
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {distribucionRangos.map((rango, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${rango.color}`}></div>
                <span className="text-sm font-medium text-gray-700">{rango.label}</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{rango.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Contribuyentes */}
      {data.top_miembros && data.top_miembros.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            Top 10 Contribuyentes
          </h3>
          <div className="space-y-3">
            {data.top_miembros.slice(0, 10).map((miembro: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{miembro.nombre}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(miembro.total_comprometido)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatPercentage(miembro.porcentaje_cumplimiento)}</p>
                  <p className="text-sm text-gray-600">cumplimiento</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Análisis por Propósitos */}
      {data.analisis_propositos && data.analisis_propositos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Análisis por Propósito
          </h3>
          <div className="space-y-4">
            {data.analisis_propositos.slice(0, 8).map((proposito: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{proposito.nombre}</span>
                  <span className="text-sm text-gray-600">{proposito.votos_count} votos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(proposito.porcentaje_avance, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatCurrency(proposito.total_recaudado)} recaudado</span>
                  <span>{formatPercentage(proposito.porcentaje_avance)} completado</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones de Exportación */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          Exportar Reporte
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => {
              // Importar dinámicamente para evitar problemas de SSR
              import('@/lib/utils/pdfGenerator').then(module => {
                module.generarPDFFinanciero(data)
              })
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Target className="h-4 w-4" />
            Exportar PDF
          </button>
          <button
            onClick={() => {
              // Importar dinámicamente para evitar problemas de SSR
              import('@/lib/utils/excelExporter').then(module => {
                const resultado = module.exportarExcelFinanciero(data)
                if (!resultado.success) {
                  alert('Error al generar Excel: ' + resultado.mensaje)
                }
              })
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Exportar Excel Avanzado
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          El Excel incluye 5 hojas: Resumen Ejecutivo, Top Contribuyentes, Análisis por Propósitos, Tendencias Mensuales y Datos para Gráficos.
        </p>
      </div>
    </div>
  )
}