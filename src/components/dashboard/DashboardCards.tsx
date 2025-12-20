'use client'

import React from 'react'

interface DashboardCardsProps {
  totalComprometido: number
  totalRecaudado: number
  totalPendiente: number
  propositosActivos: number
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export default function DashboardCards({
  totalComprometido,
  totalRecaudado,
  totalPendiente,
  propositosActivos
}: DashboardCardsProps) {
  const porcentajeCompletado = totalComprometido > 0
    ? Math.min(Math.round((totalRecaudado / totalComprometido) * 100), 100)
    : 0

  const cards = [
    {
      title: 'Total Comprometido',
      value: formatCurrency(totalComprometido),
      subtitle: 'Meta global comprometida en campañas',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
      bgGradient: 'from-cyan-50 via-blue-50 to-indigo-100',
      iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      ringColor: 'ring-cyan-500/50',
    },
    {
      title: 'Total Recaudado',
      value: formatCurrency(totalRecaudado),
      subtitle: `${porcentajeCompletado}% del total comprometido`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-emerald-500 via-teal-500 to-green-600',
      bgGradient: 'from-emerald-50 via-teal-50 to-green-100',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      ringColor: 'ring-emerald-500/50',
    },
    {
      title: 'Total Pendiente',
      value: formatCurrency(totalPendiente),
      subtitle: `${Math.max(100 - porcentajeCompletado, 0)}% por recaudar`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-amber-500 via-orange-500 to-rose-600',
      bgGradient: 'from-amber-50 via-orange-50 to-rose-100',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      ringColor: 'ring-amber-500/50',
    },
    {
      title: 'Propósitos Activos',
      value: propositosActivos.toString(),
      subtitle: 'Campañas en curso',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.5l-3.09 1.63a1 1 0 01-1.45-1.05l.59-3.44-2.5-2.44a1 1 0 01.55-1.7l3.46-.5 1.55-3.15a1 1 0 011.8 0l1.55 3.15 3.46.5a1 1 0 01.55 1.7l-2.5 2.44.59 3.44a1 1 0 01-1.45 1.05L12 18.5z" />
        </svg>
      ),
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      bgGradient: 'from-violet-50 via-purple-50 to-fuchsia-100',
      iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      ringColor: 'ring-violet-500/50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, index) => (
        <div
          key={index}
          className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden animate-slide-up"
          style={{ animationDelay: `${index * 33}ms` }}
        >
          {/* Gradiente decorativo de fondo */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-50 transition-opacity duration-300`}></div>
          
          {/* Contenido */}
          <div className="relative p-6 space-y-4">
            {/* Header con icono */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${card.iconBg} text-white shadow-md ring-4 ${card.ringColor} transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                {card.icon}
              </div>
              {/* Barra decorativa */}
              <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            </div>

            {/* Título */}
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              {card.title}
            </h3>

            {/* Valor principal */}
            <p className={`text-3xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
              {card.value}
            </p>

            {/* Subtítulo */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {card.subtitle}
            </p>

            {/* Barra de progreso para recaudado */}
            {index === 1 && totalComprometido > 0 && (
              <div className="pt-2">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden ring-1 ring-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${porcentajeCompletado}%` }}
                  ></div>
                </div>
                <span className="text-xs text-slate-600 mt-2 block font-semibold">{porcentajeCompletado}% completado</span>
              </div>
            )}
          </div>

          {/* Línea decorativa inferior */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-100`}></div>
        </div>
      ))}
    </div>
  )
}