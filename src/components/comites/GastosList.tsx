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
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <TrendingDown className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No hay gastos registrados
        </h3>
        <p className="text-slate-600 text-sm">
          Los gastos que registres aparecerán aquí
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <FiltersBar
        onFilterChange={setFilters}
        showTipo={false}
        showCategoria={false}
        showMonto={true}
        showFecha={true}
      />

      {/* Resumen de filtros */}
      {gastosFiltrados.length !== gastos.length && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-900">
              Mostrando <span className="font-bold">{gastosFiltrados.length}</span> de{" "}
              <span className="font-bold">{gastos.length}</span> gastos
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Total filtrado: ${totalFiltrado.toLocaleString("es-CO")}
            </p>
          </div>
        </div>
      )}

      {/* Lista de gastos */}
      <div className="grid gap-4">
        {gastosFiltrados.map((gasto) => (
          <div
            key={gasto.id}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Info principal */}
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-6 h-6 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {gasto.concepto}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(gasto.fecha).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadatos */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium border bg-slate-50 text-slate-700 border-slate-200">
                    <Tag className="w-3 h-3 inline mr-1" />
                    {gasto.metodo_pago}
                  </span>
                  {gasto.comprobante && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      <FileText className="w-3 h-3 inline mr-1" />
                      {gasto.comprobante}
                    </span>
                  )}
                </div>
              </div>

              {/* Monto */}
              <div className="text-right">
                <p className="text-2xl font-bold text-rose-600">
                  ${gasto.monto.toLocaleString("es-CO")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
