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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Balance Disponible */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-primary-100">Balance Disponible</span>
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <p className="text-3xl font-bold">
          ${balance.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
        </p>
        <div className="mt-3 pt-3 border-t border-primary-400">
          <p className="text-xs text-primary-100">
            {porcentajeGastado.toFixed(1)}% del presupuesto usado
          </p>
        </div>
      </div>

      {/* Total Ingresos */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600">Total Ingresos</span>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
        <p className="text-3xl font-bold text-emerald-600">
          ${totalIngresos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
        </p>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Pagos, ofrendas y donaciones</p>
        </div>
      </div>

      {/* Total Egresos */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600">Total Egresos</span>
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
        </div>
        <p className="text-3xl font-bold text-rose-600">
          ${totalEgresos.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
        </p>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Gastos y egresos del comité</p>
        </div>
      </div>
    </div>
  )
}
