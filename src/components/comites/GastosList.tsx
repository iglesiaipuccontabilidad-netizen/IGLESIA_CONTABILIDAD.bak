"use client"

import { useState, useMemo } from "react"
import { Calendar, DollarSign, Tag, FileText, TrendingDown } from "lucide-react"
import { FiltersBar, type FilterValues } from "./FiltersBar"

interface Gasto {
  id: string
  monto: number
  fecha: string
  concepto: string
  metodo_pago: string
  comprobante?: string | null
  nota?: string | null
  proyecto_id?: string | null
  registrado_por?: string | null
  created_at: string
}

interface GastosListProps {
  gastos: Gasto[]
  comiteId: string
}

const categoriaLabels: Record<string, string> = {
  operativo: "Operativo",
  infraestructura: "Infraestructura",
  social: "Social",
  otro: "Otro",
}

const categoriaColors: Record<string, string> = {
  operativo: "bg-blue-50 text-blue-700 border-blue-200",
  infraestructura: "bg-purple-50 text-purple-700 border-purple-200",
  social: "bg-emerald-50 text-emerald-700 border-emerald-200",
  otro: "bg-slate-50 text-slate-700 border-slate-200",
}

export function GastosList({ gastos, comiteId }: GastosListProps) {
  const [filters, setFilters] = useState<FilterValues>({})

  // Aplicar filtros
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((gasto) => {
      // Filtro por monto mínimo
      if (filters.montoMin !== undefined && gasto.monto < filters.montoMin) {
        return false
      }

      // Filtro por monto máximo
      if (filters.montoMax !== undefined && gasto.monto > filters.montoMax) {
        return false
      }

      // Filtro por fecha desde
      if (filters.fechaDesde && gasto.fecha < filters.fechaDesde) {
        return false
      }

      // Filtro por fecha hasta
      if (filters.fechaHasta && gasto.fecha > filters.fechaHasta) {
        return false
      }

      return true
    })
  }, [gastos, filters])

  const totalFiltrado = gastosFiltrados.reduce((sum, g) => sum + g.monto, 0)

  if (gastos.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-16 text-center shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-rose-200 rounded-full blur-2xl opacity-30"></div>
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center mx-auto">
              <TrendingDown className="w-10 h-10 text-rose-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            No hay gastos registrados
          </h3>
          <p className="text-slate-600 text-base">
            Los gastos que registres aparecerán aquí. Comienza agregando tu primer gasto.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sección de filtros mejorada */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <span>{gastos.length} total</span>
          </div>
        </div>

        <FiltersBar
          onFilterChange={setFilters}
          showTipo={false}
          showCategoria={false}
          showMonto={true}
          showFecha={true}
        />
      </div>

      {/* Resumen de filtros mejorado */}
      {gastosFiltrados.length !== gastos.length && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/60 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Mostrando <span className="text-lg font-bold">{gastosFiltrados.length}</span> de{" "}
                <span className="text-lg font-bold">{gastos.length}</span> gastos
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Total filtrado: <span className="font-bold">${totalFiltrado.toLocaleString("es-CO")}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilters({})}
            className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all duration-200 border border-blue-200"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Lista de gastos mejorada */}
      <div className="grid gap-4">
        {gastosFiltrados.map((gasto, index) => (
          <div
            key={gasto.id}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 hover:shadow-xl hover:border-rose-200 transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Borde decorativo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/5 to-rose-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Info principal */}
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <TrendingDown className="w-7 h-7 text-rose-600" />
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-rose-600 transition-colors duration-200">
                      {gasto.concepto}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-4">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">
                          {new Date(gasto.fecha).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </div>

                    {/* Metadatos con badges mejorados */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm bg-slate-50 text-slate-700 border-slate-200">
                        <Tag className="w-3.5 h-3.5" />
                        {gasto.metodo_pago}
                      </span>

                      {gasto.comprobante && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm bg-amber-50 text-amber-700 border-amber-200">
                          <FileText className="w-3.5 h-3.5" />
                          {gasto.comprobante}
                        </span>
                      )}

                      {gasto.nota && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm bg-blue-50 text-blue-700 border-blue-200">
                          <FileText className="w-3.5 h-3.5" />
                          {gasto.nota}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monto destacado */}
              <div className="flex items-center justify-end lg:justify-center">
                <div className="text-right lg:text-center">
                  <p className="text-xs font-medium text-slate-500 mb-1">Monto</p>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-rose-600 blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                    <p className="relative text-3xl lg:text-4xl font-bold bg-gradient-to-r from-rose-600 to-rose-700 bg-clip-text text-transparent">
                      ${gasto.monto.toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay resultados filtrados */}
      {gastosFiltrados.length === 0 && gastos.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-12 text-center shadow-lg">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              Intenta ajustar los filtros para ver más gastos
            </p>
            <button
              onClick={() => setFilters({})}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-all duration-200"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
