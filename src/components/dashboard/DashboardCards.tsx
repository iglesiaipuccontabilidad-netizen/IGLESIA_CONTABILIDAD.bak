'use client'

import React from 'react'

interface DashboardCardsProps {
  totalComprometido: number
  totalRecaudado: number
  totalPendiente: number
  votosActivos: number
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
  votosActivos
}: DashboardCardsProps) {
  const porcentajeCompletado = totalComprometido > 0 
    ? Math.round((totalRecaudado / totalComprometido) * 100) 
    : 0

  const cards = [
    {
      title: 'Total Comprometido',
      value: formatCurrency(totalComprometido),
      subtitle: 'Monto total de votos activos',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500',
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
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-100',
      iconBg: 'bg-green-500',
    },
    {
      title: 'Total Pendiente',
      value: formatCurrency(totalPendiente),
      subtitle: `${100 - porcentajeCompletado}% por recaudar`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-100',
      iconBg: 'bg-amber-500',
    },
    {
      title: 'Votos Activos',
      value: votosActivos.toString(),
      subtitle: 'Compromisos en progreso',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      gradient: 'from-purple-500 to-indigo-600',
      bgGradient: 'from-purple-50 to-indigo-100',
      iconBg: 'bg-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="group relative bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Gradiente de fondo decorativo */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          
          {/* Contenido */}
          <div className="relative p-6">
            {/* Header con icono */}
            <div className="flex items-start justify-between mb-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${card.iconBg} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>
            </div>

            {/* Título */}
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
              {card.title}
            </h3>

            {/* Valor principal */}
            <p className={`text-3xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent mb-2`}>
              {card.value}
            </p>

            {/* Subtítulo */}
            <p className="text-sm text-slate-500">
              {card.subtitle}
            </p>

            {/* Barra de progreso para recaudado */}
            {index === 1 && totalComprometido > 0 && (
              <div className="mt-4">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${porcentajeCompletado}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Decoración inferior */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`}></div>
        </div>
      ))}
    </div>
  )
}