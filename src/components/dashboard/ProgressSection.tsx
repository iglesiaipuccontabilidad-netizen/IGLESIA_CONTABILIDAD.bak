'use client'

import React from 'react'

interface ProgressSectionProps {
  stats: {
    total_comprometido: number
    total_recaudado: number
    total_pendiente: number
    propositos_activos: number
    progreso_general: number
  }
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(value)

export const ProgressSection = React.memo(({ stats }: ProgressSectionProps) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Progreso global de propósitos</h2>
          <p className="text-slate-600 text-sm">
            Seguimiento del avance en todas las campañas activas y completadas
          </p>
        </div>
        <div className="w-full lg:w-2/5">
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-sm font-semibold text-slate-700">Avance general</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-cyan-600 bg-clip-text text-transparent">
                {stats.progreso_general}%
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200">
              <div
                className="h-full bg-gradient-to-r from-primary-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-700 shadow-md"
                style={{ width: `${stats.progreso_general}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Grid de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/50 min-w-0">
          <span className="block text-xs text-emerald-600 font-semibold mb-1">Recaudado</span>
          <span className="block text-lg font-bold text-emerald-700 break-words">
            {formatCurrency(stats.total_recaudado)}
          </span>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/50 min-w-0">
          <span className="block text-xs text-amber-600 font-semibold mb-1">Pendiente</span>
          <span className="block text-lg font-bold text-amber-700 break-words">
            {formatCurrency(stats.total_pendiente)}
          </span>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200/50 min-w-0">
          <span className="block text-xs text-blue-600 font-semibold mb-1">Comprometido</span>
          <span className="block text-lg font-bold text-blue-700 break-words">
            {formatCurrency(stats.total_comprometido)}
          </span>
        </div>
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-200/50 min-w-0">
          <span className="block text-xs text-purple-600 font-semibold mb-1">Campañas activas</span>
          <span className="block text-lg font-bold text-purple-700">{stats.propositos_activos}</span>
        </div>
      </div>
    </div>
  )
})

ProgressSection.displayName = 'ProgressSection'
