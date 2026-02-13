'use client'

import React from 'react'
import Link from '@/components/OrgLink'
import { Target, ArrowUpRight } from 'lucide-react'

interface PropositoData {
  id: string
  nombre: string
  descripcion: string | null
  monto_objetivo: number | null
  monto_recaudado: number
  estado: string
  fecha_fin: string | null
  fecha_inicio: string | null
  created_at: string | null
}

interface RecentPropositionsProps {
  propositos: PropositoData[]
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(value)

const PropositoCard = React.memo(({ proposito }: { proposito: PropositoData }) => {
  const objetivo = proposito.monto_objetivo ?? 0
  const recaudado = proposito.monto_recaudado ?? 0
  const progreso = objetivo > 0 ? Math.min(Math.round((recaudado / objetivo) * 100), 100) : 0

  const estadoBadge = proposito.estado === 'activo'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : proposito.estado === 'completado'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-50 text-slate-700 border-slate-200'

  return (
    <Link
      href={`/dashboard/propositos/${proposito.id}`}
      className="group bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-md sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors break-words">
            {proposito.nombre}
          </h3>
          {proposito.descripcion && (
            <p className="text-sm text-slate-600 mt-1 line-clamp-3 break-words">{proposito.descripcion}</p>
          )}
        </div>
        <span className={`mt-2 sm:mt-0 px-2.5 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap flex-shrink-0 ${estadoBadge}`}>
          {proposito.estado}
        </span>
      </div>

      {/* Progreso */}
      <div className="space-y-3 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Progreso</span>
          <span className="font-bold text-slate-900 text-sm">{progreso}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progreso}%` }}
          ></div>
        </div>

        {/* Financiero */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="p-2 bg-slate-50 rounded-lg min-w-0">
            <span className="block text-xs text-slate-600 font-semibold mb-1">Recaudado</span>
            <span className="block text-sm font-bold text-slate-900 truncate">{formatCurrency(recaudado)}</span>
          </div>
          {objetivo > 0 && (
            <div className="p-2 bg-slate-50 rounded-lg min-w-0">
              <span className="block text-xs text-slate-600 font-semibold mb-1">Meta</span>
              <span className="block text-sm font-bold text-slate-900 truncate">{formatCurrency(objetivo)}</span>
            </div>
          )}
        </div>

        {/* Fecha */}
        {proposito.fecha_fin && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Finaliza {new Date(proposito.fecha_fin).toLocaleDateString('es-CO')}</span>
          </div>
        )}
      </div>
    </Link>
  )
})

PropositoCard.displayName = 'PropositoCard'

export const RecentPropositionsSection = React.memo(({ propositos }: RecentPropositionsProps) => {
  const propositosRecientes = propositos.slice(0, 4)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Propósitos recientes</h2>
          <p className="text-slate-600 text-sm mt-1">Últimas campañas creadas y su avance financiero</p>
        </div>
        <Link
          href="/dashboard/propositos"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all"
        >
          Ver todas las campañas
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {propositosRecientes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
            <Target className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Aún no hay propósitos registrados</h3>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">
            Comienza creando una campaña financiera para la iglesia y haz seguimiento a tu progreso.
          </p>
          <Link
            href="/dashboard/propositos/nuevo"
            className="w-full sm:inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-cyan-700 transition-all hover:shadow-lg"
          >
            <span>Crear nueva campaña</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {propositosRecientes.map((proposito) => (
            <PropositoCard key={proposito.id} proposito={proposito} />
          ))}
        </div>
      )}
    </div>
  )
})

RecentPropositionsSection.displayName = 'RecentPropositionsSection'
