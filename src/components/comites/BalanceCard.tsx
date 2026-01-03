"use client"

import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface BalanceData {
  balance: number
  total_ingresos: number
  total_egresos: number
}

interface BalanceCardProps {
  data: BalanceData
  isLoading?: boolean
}

export function BalanceCard({ data, isLoading = false }: BalanceCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 sm:p-6">
            <div className="h-4 bg-slate-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    )
  }

  // Validación defensiva de datos
  const balance = data?.balance ?? 0
  const totalIngresos = data?.total_ingresos ?? 0
  const totalEgresos = data?.total_egresos ?? 0

  const porcentajeGastado = totalIngresos > 0
    ? (totalEgresos / totalIngresos) * 100
    : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Balance Disponible - Destacado */}
      <div className="group relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-5 sm:p-6 lg:p-8 text-white overflow-hidden hover:shadow-2xl hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
        {/* Efectos de fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-primary-800/30 rounded-full blur-2xl"></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <span className="text-xs sm:text-sm font-medium text-primary-100 block mb-2">Balance Disponible</span>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                ${balance.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-primary-400/30">
            <div className="flex items-center justify-between text-primary-100 text-xs sm:text-sm mb-2">
              <span>Presupuesto usado</span>
              <span className="font-bold">{porcentajeGastado.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/40 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(porcentajeGastado, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Ingresos */}
      <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 sm:p-6 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm font-medium text-slate-600">Total Ingresos</span>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
          </div>

          <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent mb-3 sm:mb-4">
            ${totalIngresos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
          </p>

          <div className="pt-3 sm:pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block"></span>
              Pagos, ofrendas y donaciones
            </p>
          </div>
        </div>
      </div>

      {/* Total Egresos */}
      <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 sm:p-6 hover:shadow-xl hover:border-rose-200 transition-all duration-300 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm font-medium text-slate-600">Total Egresos</span>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
            </div>
          </div>

          <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 to-rose-700 bg-clip-text text-transparent mb-3 sm:mb-4">
            ${totalEgresos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
          </p>

          <div className="pt-3 sm:pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              Gastos y egresos del comité
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
