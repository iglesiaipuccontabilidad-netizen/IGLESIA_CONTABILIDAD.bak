'use client'

import React from 'react'
import { TrendingUp, Target, ArrowUpRight } from 'lucide-react'

interface QuickSummaryProps {
  stats: {
    propositos_completados: number
    propositos_activos: number
    propositos_cancelados: number
  }
}

export const QuickSummarySection = React.memo(({ stats }: QuickSummaryProps) => {
  const resumenRapido = [
    {
      title: 'Campañas completadas',
      value: stats.propositos_completados,
      description: 'Propósitos que alcanzaron su objetivo',
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />
    },
    {
      title: 'Campañas activas',
      value: stats.propositos_activos,
      description: 'Propósitos actualmente en progreso',
      icon: <Target className="w-5 h-5 text-blue-600" />
    },
    {
      title: 'Campañas canceladas',
      value: stats.propositos_cancelados,
      description: 'Propósitos detenidos o cancelados',
      icon: <ArrowUpRight className="w-5 h-5 text-rose-500 rotate-45" />
    }
  ]

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900 px-1">Información adicional</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {resumenRapido.map((item) => (
          <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">{item.title}</p>
                <p className="text-3xl font-bold text-slate-900">{item.value}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mt-3 border-t border-slate-100 pt-3">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
})

QuickSummarySection.displayName = 'QuickSummarySection'
