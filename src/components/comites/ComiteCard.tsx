"use client"

import Link from "next/link"
import { Users2, UserCog, Calendar, Activity, AlertTriangle, TrendingUp } from "lucide-react"
import type { ComiteRow } from "@/types/comites"

interface ComiteCardProps {
  comite: ComiteRow & {
    usuarios_count?: number
    miembros_count?: number
    balance?: number
  }
}

export function ComiteCard({ comite }: ComiteCardProps) {
  const isActivo = comite.estado === 'activo'
  
  return (
    <Link 
      href={`/dashboard/comites/${comite.id}`}
      className="block group"
    >
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
              {comite.nombre}
            </h3>
            {comite.descripcion && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {comite.descripcion}
              </p>
            )}
          </div>
          
          <span className={`
            px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
            ${isActivo 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-slate-100 text-slate-600 border border-slate-200'
            }
          `}>
            <Activity className="w-3 h-3" />
            {isActivo ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Usuarios</p>
              <p className="text-lg font-semibold text-slate-900">
                {comite.usuarios_count ?? 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Users2 className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Miembros</p>
              <p className="text-lg font-semibold text-slate-900">
                {comite.miembros_count ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Balance (si está disponible) */}
        {typeof comite.balance !== 'undefined' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Balance actual</span>
                {comite.balance < 100000 && (
                  <div className="group relative">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Balance bajo
                    </div>
                  </div>
                )}
              </div>
              <span className={`text-lg font-bold transition-colors ${
                comite.balance < 0 
                  ? 'text-rose-600' 
                  : comite.balance < 100000 
                  ? 'text-amber-600' 
                  : 'text-emerald-600'
              }`}>
                ${comite.balance.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(comite.created_at).toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </div>
          <span className="text-primary-600 group-hover:text-primary-700 font-medium">
            Ver detalles →
          </span>
        </div>
      </div>
    </Link>
  )
}
