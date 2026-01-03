"use client"

import { useMemo } from "react"
import { TrendingUp, DollarSign, Calendar, Target } from "lucide-react"

interface Ofrenda {
  id: string
  monto: number
  fecha: string
  tipo: string
  concepto: string
  nota: string | null
  proyecto_id: string | null
  registrado_por: string | null
  created_at: string
  comite_id: string
  proyecto_nombre?: string | undefined
  comite_proyectos?: any
}

interface OfrendasStatsProps {
  ofrendas: Ofrenda[]
}

export function OfrendasStats({ ofrendas }: OfrendasStatsProps) {
  const stats = useMemo(() => {
    const total = ofrendas.length
    const montoTotal = ofrendas.reduce((sum, o) => sum + o.monto, 0)

    // Estadísticas por tipo
    const porTipo = ofrendas.reduce((acc, o) => {
      acc[o.tipo] = (acc[o.tipo] || 0) + o.monto
      return acc
    }, {} as Record<string, number>)

    // Estadísticas mensuales (últimos 6 meses)
    const mensual = ofrendas.reduce((acc, o) => {
      const fecha = new Date(o.fecha)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      acc[mesKey] = (acc[mesKey] || 0) + o.monto
      return acc
    }, {} as Record<string, number>)

    // Promedio por ofrenda
    const promedio = total > 0 ? montoTotal / total : 0

    // Mayor ofrenda
    const mayorOfrenda = ofrendas.length > 0 ? Math.max(...ofrendas.map(o => o.monto)) : 0

    // Tendencia (comparación con mes anterior)
    const meses = Object.keys(mensual).sort().slice(-2)
    const tendencia = meses.length === 2 ?
      ((mensual[meses[1]] - mensual[meses[0]]) / mensual[meses[0]]) * 100 : 0

    return {
      total,
      montoTotal,
      porTipo,
      promedio,
      mayorOfrenda,
      tendencia,
      mensual
    }
  }, [ofrendas])

  const tipoLabels: Record<string, string> = {
    diezmo: "Diezmo",
    ofrenda: "Ofrenda",
    primicia: "Primicia",
    otro: "Otro",
  }

  const tipoColors: Record<string, string> = {
    diezmo: "bg-emerald-500",
    ofrenda: "bg-blue-500",
    primicia: "bg-purple-500",
    otro: "bg-slate-500",
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Tarjetas principales de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ofrendas */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Ofrendas</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Monto Total - Destacado */}
        <div className="group relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl p-6 text-white overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-1 lg:col-span-2">
          {/* Efectos de fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-emerald-800/30 rounded-full blur-2xl"></div>

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                </div>
                <p className="text-emerald-100 text-sm font-medium mb-2">Monto Total Recaudado</p>
                <p className="text-4xl font-bold tracking-tight">
                  ${stats.montoTotal.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-emerald-100 text-sm">
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/40 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
              <span className="font-medium">100%</span>
            </div>
          </div>
        </div>

        {/* Promedio */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Promedio por Ofrenda</p>
            <p className="text-3xl font-bold text-slate-900">
              ${stats.promedio.toLocaleString('es-CO')}
            </p>
            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        {/* Tendencia */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className={`absolute inset-0 bg-gradient-to-br ${stats.tendencia >= 0 ? 'from-green-50/50' : 'from-red-50/50'} to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stats.tendencia >= 0 ? 'from-green-100 to-green-200' : 'from-red-100 to-red-200'} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Calendar className={`w-6 h-6 ${stats.tendencia >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className={`w-2 h-2 rounded-full ${stats.tendencia >= 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Tendencia Mensual</p>
            <p className={`text-3xl font-bold ${stats.tendencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.tendencia >= 0 ? '+' : ''}{stats.tendencia.toFixed(1)}%
            </p>
            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${stats.tendencia >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} rounded-full`} style={{ width: `${Math.min(Math.abs(stats.tendencia), 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por tipo - Mejorado */}
      {Object.keys(stats.porTipo).length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Distribución por Tipo</h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Análisis detallado</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(stats.porTipo).map(([tipo, monto]) => {
              const porcentaje = ((monto / stats.montoTotal) * 100).toFixed(1)
              return (
                <div key={tipo} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all duration-300">
                    {/* Barra de progreso circular */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-3 h-3 rounded-full ${tipoColors[tipo] || 'bg-slate-500'} group-hover:scale-125 transition-transform duration-300`}></div>
                      <span className="text-xs font-semibold text-slate-500">{porcentaje}%</span>
                    </div>

                    {/* Nombre del tipo */}
                    <p className="text-sm font-semibold text-slate-700 mb-2">{tipoLabels[tipo] || tipo}</p>

                    {/* Monto */}
                    <p className="text-2xl font-bold text-slate-900 mb-3">
                      ${monto.toLocaleString('es-CO')}
                    </p>

                    {/* Barra de progreso */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${tipoColors[tipo] || 'bg-slate-500'} rounded-full transition-all duration-500 group-hover:opacity-80`}
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}