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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Ofrendas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Total Ofrendas</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Monto Total */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm">Monto Total</p>
            <p className="text-3xl font-bold mt-1">
              ${stats.montoTotal.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-400/30 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Promedio */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Promedio</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              ${stats.promedio.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tendencia */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Tendencia</p>
            <p className={`text-3xl font-bold mt-1 ${stats.tendencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.tendencia >= 0 ? '+' : ''}{stats.tendencia.toFixed(1)}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Distribución por tipo */}
      {Object.keys(stats.porTipo).length > 0 && (
        <div className="md:col-span-2 lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Distribución por Tipo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.porTipo).map(([tipo, monto]) => (
              <div key={tipo} className="text-center">
                <div className={`w-full h-2 rounded-full mb-2 ${tipoColors[tipo] || 'bg-slate-500'}`}></div>
                <p className="text-sm font-medium text-slate-900">{tipoLabels[tipo] || tipo}</p>
                <p className="text-lg font-bold text-slate-700">${monto.toLocaleString('es-CO')}</p>
                <p className="text-xs text-slate-500">
                  {((monto / stats.montoTotal) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}