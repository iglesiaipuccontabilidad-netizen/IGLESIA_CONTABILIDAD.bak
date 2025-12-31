"use client"

import { useState } from "react"
import { Filter, X, Calendar, DollarSign, Tag } from "lucide-react"

interface FilterOption {
  label: string
  value: string
}

interface FiltersBarProps {
  onFilterChange: (filters: FilterValues) => void
  tipoOptions?: FilterOption[]
  categoriaOptions?: FilterOption[]
  showTipo?: boolean
  showCategoria?: boolean
  showMonto?: boolean
  showFecha?: boolean
}

export interface FilterValues {
  tipo?: string
  categoria?: string
  montoMin?: number
  montoMax?: number
  fechaDesde?: string
  fechaHasta?: string
}

export function FiltersBar({
  onFilterChange,
  tipoOptions = [],
  categoriaOptions = [],
  showTipo = true,
  showCategoria = true,
  showMonto = true,
  showFecha = true,
}: FiltersBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({})
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    
    // Contar filtros activos
    const count = Object.values(newFilters).filter(v => v !== undefined && v !== "").length
    setActiveFiltersCount(count)
    
    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    setActiveFiltersCount(0)
    onFilterChange({})
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Filters Content */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tipo */}
          {showTipo && tipoOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Tipo
              </label>
              <select
                value={filters.tipo || ""}
                onChange={(e) => handleFilterChange("tipo", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                {tipoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Categoría */}
          {showCategoria && categoriaOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Categoría
              </label>
              <select
                value={filters.categoria || ""}
                onChange={(e) => handleFilterChange("categoria", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas</option>
                {categoriaOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Monto Mínimo */}
          {showMonto && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Monto mínimo
                </label>
                <input
                  type="number"
                  value={filters.montoMin || ""}
                  onChange={(e) => handleFilterChange("montoMin", parseFloat(e.target.value))}
                  placeholder="$0"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Monto máximo
                </label>
                <input
                  type="number"
                  value={filters.montoMax || ""}
                  onChange={(e) => handleFilterChange("montoMax", parseFloat(e.target.value))}
                  placeholder="$999,999,999"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </>
          )}

          {/* Fecha Desde */}
          {showFecha && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={filters.fechaDesde || ""}
                  onChange={(e) => handleFilterChange("fechaDesde", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={filters.fechaHasta || ""}
                  onChange={(e) => handleFilterChange("fechaHasta", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
