'use client'

import { useState } from 'react'
import { Search, Calendar, Filter } from 'lucide-react'

interface ReportFilterProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  busqueda: string
  fechaInicio: string
  fechaFin: string
  estado: string
  miembroId: string
  propositoId: string
}

export default function ReportFilter({ onFilterChange }: ReportFilterProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>({
    busqueda: '',
    fechaInicio: '',
    fechaFin: '',
    estado: '',
    miembroId: '',
    propositoId: ''
  })

  const handleChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClear = () => {
    const emptyFilters: FilterState = {
      busqueda: '',
      fechaInicio: '',
      fechaFin: '',
      estado: '',
      miembroId: '',
      propositoId: ''
    }
    setLocalFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Búsqueda
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={localFilters.busqueda}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              onChange={(e) => handleChange('busqueda', e.target.value)}
            />
          </div>
        </div>

        {/* Fecha Inicio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fecha Inicio
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={localFilters.fechaInicio}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              onChange={(e) => handleChange('fechaInicio', e.target.value)}
            />
          </div>
        </div>

        {/* Fecha Fin */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fecha Fin
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={localFilters.fechaFin}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              onChange={(e) => handleChange('fechaFin', e.target.value)}
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Estado
          </label>
          <select
            value={localFilters.estado}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            onChange={(e) => handleChange('estado', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="completado">Completado</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>

        {/* Botón de limpiar filtros */}
        <div className="flex items-end">
          <button
            onClick={handleClear}
            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  )
}
