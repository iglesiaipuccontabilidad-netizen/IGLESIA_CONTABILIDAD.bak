"use client"

import { ArrowDownCircle, ArrowUpCircle, Calendar } from "lucide-react"

interface Transaccion {
  id: string
  tipo: 'ingreso' | 'egreso'
  concepto: string
  monto: number
  fecha: string
  categoria?: string
}

interface TransaccionesRecientesProps {
  transacciones: Transaccion[]
  isLoading?: boolean
}

export function TransaccionesRecientes({ transacciones, isLoading = false }: TransaccionesRecientesProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <div className="h-6 bg-slate-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
              <div className="h-5 bg-slate-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (transacciones.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Últimas Transacciones
        </h3>
        <div className="text-center py-8 text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p>No hay transacciones registradas</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Últimas Transacciones
        </h3>
        <span className="text-sm text-slate-500">
          {transacciones.length} registros
        </span>
      </div>

      <div className="space-y-3">
        {transacciones.map((transaccion) => {
          const isIngreso = transaccion.tipo === 'ingreso'
          
          return (
            <div
              key={transaccion.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {/* Icono */}
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${isIngreso 
                    ? 'bg-emerald-50' 
                    : 'bg-rose-50'
                  }
                `}
              >
                {isIngreso ? (
                  <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ArrowDownCircle className="w-5 h-5 text-rose-600" />
                )}
              </div>

              {/* Información */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {transaccion.concepto}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(transaccion.fecha).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                  {transaccion.categoria && (
                    <>
                      <span>•</span>
                      <span>{transaccion.categoria}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Monto */}
              <div className="text-right">
                <p
                  className={`
                    font-semibold text-sm
                    ${isIngreso ? 'text-emerald-600' : 'text-rose-600'}
                  `}
                >
                  {isIngreso ? '+' : '-'}$
                  {transaccion.monto.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Ver todas */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <button className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
          Ver todas las transacciones →
        </button>
      </div>
    </div>
  )
}
