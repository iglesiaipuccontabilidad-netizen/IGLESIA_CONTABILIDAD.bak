"use client"

import { useState, useMemo, useEffect } from "react"
import { Calendar, DollarSign, Tag, FileText, TrendingUp, FolderOpen } from "lucide-react"
import { FiltersBar, type FilterValues } from "./FiltersBar"

interface ExtendedFilterValues extends FilterValues {
  proyecto?: string
}

interface Ofrenda {
  id: string
  monto: number
  fecha: string
  tipo: string
  concepto: string
  nota: string | null
  proyecto_id: string | null
  registrado_por: string | null
  created_at: string
  comite_id: string
  proyecto_nombre?: string | undefined
  comite_proyectos?: any
}

interface OfrendasListProps {
  ofrendas: Ofrenda[]
  comiteId: string
}

const tipoLabels: Record<string, string> = {
  diezmo: "Diezmo",
  ofrenda: "Ofrenda",
  primicia: "Primicia",
  otro: "Otro",
}

const tipoColors: Record<string, string> = {
  diezmo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ofrenda: "bg-blue-50 text-blue-700 border-blue-200",
  primicia: "bg-purple-50 text-purple-700 border-purple-200",
  otro: "bg-slate-50 text-slate-700 border-slate-200",
}

export function OfrendasList({ ofrendas, comiteId }: OfrendasListProps) {
  const [filters, setFilters] = useState<ExtendedFilterValues>({})
  const [proyectos, setProyectos] = useState<any[]>([])

  // Cargar proyectos del comité
  useEffect(() => {
    const cargarProyectos = async () => {
      try {
        const { getProyectosComite } = await import("@/app/actions/comites-actions")
        const result = await getProyectosComite(comiteId)
        if (result.success && result.data) {
          setProyectos(result.data.filter((p: any) => p.estado === 'activo'))
        }
      } catch (error) {
        console.error('Error al cargar proyectos:', error)
      }
    }
    cargarProyectos()
  }, [comiteId])

  const tipoOptions = [
    { label: "Diezmo", value: "diezmo" },
    { label: "Ofrenda", value: "ofrenda" },
    { label: "Primicia", value: "primicia" },
    { label: "Otro", value: "otro" },
  ]

  // Aplicar filtros
  const ofrendasFiltradas = useMemo(() => {
    return ofrendas.filter((ofrenda) => {
      // Filtro por tipo
      if (filters.tipo && ofrenda.tipo !== filters.tipo) {
        return false
      }

      // Filtro por proyecto
      if (filters.proyecto && ofrenda.proyecto_id !== filters.proyecto) {
        return false
      }

      // Filtro por monto mínimo
      if (filters.montoMin !== undefined && ofrenda.monto < filters.montoMin) {
        return false
      }

      // Filtro por monto máximo
      if (filters.montoMax !== undefined && ofrenda.monto > filters.montoMax) {
        return false
      }

      // Filtro por fecha desde
      if (filters.fechaDesde && ofrenda.fecha < filters.fechaDesde) {
        return false
      }

      // Filtro por fecha hasta
      if (filters.fechaHasta && ofrenda.fecha > filters.fechaHasta) {
        return false
      }

      return true
    })
  }, [ofrendas, filters])

  const totalFiltrado = ofrendasFiltradas.reduce((sum, o) => sum + o.monto, 0)

  if (ofrendas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No hay ofrendas registradas
        </h3>
        <p className="text-slate-600 text-sm">
          Las ofrendas que registres aparecerán aquí
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <FiltersBar
        onFilterChange={setFilters}
        tipoOptions={tipoOptions}
        showTipo={true}
        showCategoria={false}
        showMonto={true}
        showFecha={true}
      />

      {/* Filtro adicional de proyecto */}
      {proyectos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mt-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Proyecto:
            </label>
            <select
              value={filters.proyecto || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, proyecto: e.target.value || undefined }))}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos los proyectos</option>
              {proyectos.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Resumen de filtros */}
      {ofrendasFiltradas.length !== ofrendas.length && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-900">
              Mostrando <span className="font-bold">{ofrendasFiltradas.length}</span> de{" "}
              <span className="font-bold">{ofrendas.length}</span> ofrendas
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Total filtrado: ${totalFiltrado.toLocaleString("es-CO")}
            </p>
          </div>
        </div>
      )}

      {/* Lista de ofrendas */}
      <div className="grid gap-4">
        {ofrendasFiltradas.map((ofrenda) => (
          <div
            key={ofrenda.id}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Info principal */}
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {ofrenda.concepto || tipoLabels[ofrenda.tipo] || "Ofrenda"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ofrenda.fecha).toLocaleDateString("es-CO", {
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
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      tipoColors[ofrenda.tipo] || tipoColors.otro
                    }`}
                  >
                    <Tag className="w-3 h-3 inline mr-1" />
                    {tipoLabels[ofrenda.tipo] || "Otro"}
                  </span>
                  {ofrenda.proyecto_nombre && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
                      <FolderOpen className="w-3 h-3 inline mr-1" />
                      {ofrenda.proyecto_nombre}
                    </span>
                  )}
                  {ofrenda.nota && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      <FileText className="w-3 h-3 inline mr-1" />
                      {ofrenda.nota}
                    </span>
                  )}
                </div>
              </div>

              {/* Monto */}
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">
                  ${ofrenda.monto.toLocaleString("es-CO")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
