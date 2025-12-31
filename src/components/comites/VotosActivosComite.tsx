"use client"

import { ScrollText, User, Calendar, DollarSign, AlertCircle } from "lucide-react"
import Link from "next/link"

interface VotoActivo {
  id: string
  miembro_nombre: string
  proyecto_nombre?: string
  concepto: string
  monto_total: number
  recaudado: number
  fecha_limite: string
  estado: string
}

interface VotosActivosComiteProps {
  votos: VotoActivo[]
  comiteId: string
  isLoading?: boolean
}

export function VotosActivosComite({ votos, comiteId, isLoading = false }: VotosActivosComiteProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <div className="h-6 bg-slate-200 rounded w-40 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-lg animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (votos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Votos Activos
        </h3>
        <div className="text-center py-8 text-slate-500">
          <ScrollText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p>No hay votos activos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-primary-600" />
          Votos Activos
        </h3>
        <span className="text-sm font-medium text-slate-500">
          {votos.length} {votos.length === 1 ? 'voto' : 'votos'}
        </span>
      </div>

      <div className="space-y-3">
        {votos.map((voto) => {
          const porcentaje = voto.monto_total > 0 
            ? (voto.recaudado / voto.monto_total) * 100 
            : 0
          
          const estaVencido = new Date(voto.fecha_limite) < new Date()
          const faltaPoco = !estaVencido && 
            (new Date(voto.fecha_limite).getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000

          return (
            <div
              key={voto.id}
              className="p-4 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-slate-400" />
                    <p className="font-medium text-slate-900">
                      {voto.miembro_nombre}
                    </p>
                  </div>
                  {voto.proyecto_nombre && (
                    <p className="text-sm text-slate-600 mb-1">
                      {voto.proyecto_nombre}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {voto.concepto}
                  </p>
                </div>

                {(estaVencido || faltaPoco) && (
                  <div className={`
                    flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                    ${estaVencido 
                      ? 'bg-rose-50 text-rose-700' 
                      : 'bg-amber-50 text-amber-700'
                    }
                  `}>
                    <AlertCircle className="w-3 h-3" />
                    {estaVencido ? 'Vencido' : 'Por vencer'}
                  </div>
                )}
              </div>

              {/* Progreso */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Progreso</span>
                  <span className="font-medium">{porcentaje.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`
                      h-full rounded-full transition-all
                      ${porcentaje >= 100 
                        ? 'bg-emerald-500' 
                        : porcentaje >= 50 
                        ? 'bg-primary-500' 
                        : 'bg-amber-500'
                      }
                    `}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-500">
                  <DollarSign className="w-3 h-3" />
                  <span>
                    ${voto.recaudado.toLocaleString('es-CO')} / $
                    {voto.monto_total.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(voto.fecha_limite).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Ver todos */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <Link
          href={`/dashboard/comites/${comiteId}/votos`}
          className="block w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          Ver todos los votos →
        </Link>
      </div>
    </div>
  )
}
