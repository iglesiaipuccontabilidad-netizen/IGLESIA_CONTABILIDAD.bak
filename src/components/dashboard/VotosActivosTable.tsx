'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface Voto {
  id: string
  miembro: {
    nombres: string
    apellidos: string
  }
  proposito: string
  monto_total: number
  total_pagado: number
  fecha_limite: string
  progreso: number
}

interface VotosActivosTableProps {
  votos: Voto[]
}

export default function VotosActivosTable({ votos }: VotosActivosTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysRemaining = (date: string) => {
    const today = new Date()
    const deadline = new Date(date)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredVotos = votos.filter(voto => {
    const searchLower = searchTerm.toLowerCase()
    return (
      voto.miembro.nombres.toLowerCase().includes(searchLower) ||
      voto.miembro.apellidos.toLowerCase().includes(searchLower) ||
      voto.proposito.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="card">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Votos Activos</h2>
            <p className="text-sm text-slate-600 mt-1">{filteredVotos.length} compromisos en progreso</p>
          </div>
          
          {/* Búsqueda */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por miembro o propósito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla Desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Miembro</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Propósito</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Monto</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Progreso</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha Límite</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredVotos.map((voto, index) => {
              const progreso = voto.progreso
              const daysRemaining = getDaysRemaining(voto.fecha_limite)
              
              return (
                <tr key={voto.id} className="hover:bg-primary-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-cyan-500 flex items-center justify-center text-white font-semibold">
                        {voto.miembro.nombres.charAt(0)}{voto.miembro.apellidos.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {voto.miembro.nombres} {voto.miembro.apellidos}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900 max-w-xs truncate">{voto.proposito}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(voto.monto_total)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-xs font-medium text-slate-600">{Math.round(progreso)}%</span>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                          style={{ width: `${progreso}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <p className="text-sm text-slate-900">{formatDate(voto.fecha_limite)}</p>
                      {daysRemaining >= 0 ? (
                        <span className={`text-xs font-medium ${daysRemaining <= 7 ? 'text-red-600' : 'text-slate-500'}`}>
                          {daysRemaining === 0 ? 'Hoy' : `${daysRemaining} días`}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-red-600">Vencido</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/dashboard/pagos/nuevo?voto=${voto.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Pago
                      </Link>
                      <Link
                        href={`/dashboard/votos/${voto.id}`}
                        className="btn btn-sm btn-outline"
                      >
                        Ver
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className="lg:hidden divide-y divide-slate-200">
        {filteredVotos.map((voto) => {
          const recaudado = voto.total_pagado || 0
          const progreso = voto.monto_total > 0 ? (recaudado / voto.monto_total) * 100 : 0
          const daysRemaining = getDaysRemaining(voto.fecha_limite)
          
          return (
            <div key={voto.id} className="p-6 hover:bg-primary-50 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                    {voto.miembro.nombres.charAt(0)}{voto.miembro.apellidos.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {voto.miembro.nombres} {voto.miembro.apellidos}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(voto.fecha_limite)}</p>
                  </div>
                </div>
                {daysRemaining >= 0 ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    daysRemaining <= 7 
                      ? 'bg-rose-50 text-rose-500'
                      : 'bg-primary-50 text-primary-500'
                  }`}>
                    {daysRemaining === 0 ? 'Hoy' : `${daysRemaining}d`}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-500">
                    Vencido
                  </span>
                )}
              </div>

              {/* Propósito */}
              <p className="text-sm text-slate-700 mb-4">{voto.proposito}</p>

              {/* Montos */}
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Monto Total</p>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(voto.monto_total)}</p>
              </div>

              {/* Progreso */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">Progreso</span>
                  <span className="text-xs font-semibold text-slate-900">{Math.round(progreso)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${progreso}%` }}
                  ></div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex space-x-2">
                <Link
                  href={`/dashboard/pagos/nuevo?voto=${voto.id}`}
                  className="btn btn-sm btn-primary flex-1"
                >
                  Registrar Pago
                </Link>
                <Link
                  href={`/dashboard/votos/${voto.id}`}
                  className="btn btn-sm btn-outline"
                >
                  Ver Detalles
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredVotos.length === 0 && (
        <div className="p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-slate-900">No se encontraron votos</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay votos activos en este momento'}
          </p>
        </div>
      )}
    </div>
  )
}