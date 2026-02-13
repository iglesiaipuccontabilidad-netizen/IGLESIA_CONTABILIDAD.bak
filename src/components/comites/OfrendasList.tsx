"use client"

import { useState, useMemo, useEffect } from "react"
import { Calendar, DollarSign, Tag, FileText, TrendingUp, FolderOpen, Eye, Edit, Trash2 } from "lucide-react"
import { FiltersBar, type FilterValues } from "./FiltersBar"
import Link from "@/components/OrgLink"
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal"

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
  canManage?: boolean
  isAdmin?: boolean
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

export function OfrendasList({ ofrendas, comiteId, canManage = false, isAdmin = false }: OfrendasListProps) {
  console.log('🎯 OfrendasList - Props recibidos:', { canManage, isAdmin, totalOfrendas: ofrendas?.length || 0 })
  
  const [filters, setFilters] = useState<ExtendedFilterValues>({})
  const [proyectos, setProyectos] = useState<any[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [ofrendaToDelete, setOfrendaToDelete] = useState<string | null>(null)

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

  const handleDeleteClick = (ofrendaId: string) => {
    setOfrendaToDelete(ofrendaId)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!ofrendaToDelete) return

    setDeletingId(ofrendaToDelete)
    try {
      console.log('🗑️ Intentando eliminar ofrenda:', ofrendaToDelete)
      const { deleteComiteOfrenda } = await import("@/app/actions/comites-actions")
      const result = await deleteComiteOfrenda(ofrendaToDelete)
      
      console.log('📥 Resultado de eliminación:', result)
      
      if (result.success) {
        setShowDeleteModal(false)
        alert('✅ Ofrenda eliminada exitosamente')
        window.location.reload()
      } else {
        console.error('❌ Error del servidor:', result.error)
        alert(`❌ Error: ${result.error || 'No se pudo eliminar la ofrenda'}`)
      }
    } catch (error) {
      console.error('❌ Error crítico:', error)
      alert(`❌ Error crítico: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setDeletingId(null)
      setOfrendaToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setOfrendaToDelete(null)
  }

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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-16 text-center shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full blur-2xl opacity-30"></div>
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mx-auto">
              <TrendingUp className="w-10 h-10 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            No hay ofrendas registradas
          </h3>
          <p className="text-slate-600 text-base">
            Las ofrendas que registres aparecerán aquí. Comienza agregando tu primera ofrenda.
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
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
            <span>{ofrendas.length} total</span>
          </div>
        </div>

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
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 min-w-fit">
                <FolderOpen className="w-4 h-4 text-primary-600" />
                Proyecto:
              </label>
              <select
                value={filters.proyecto || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, proyecto: e.target.value || undefined }))}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white hover:border-slate-300 transition-all duration-200"
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
      </div>

      {/* Resumen de filtros mejorado */}
      {ofrendasFiltradas.length !== ofrendas.length && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/60 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Mostrando <span className="text-lg font-bold">{ofrendasFiltradas.length}</span> de{" "}
                <span className="text-lg font-bold">{ofrendas.length}</span> ofrendas
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

      {/* Lista de ofrendas mejorada */}
      <div className="grid gap-4">
        {ofrendasFiltradas.map((ofrenda, index) => (
          <div
            key={ofrenda.id}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Borde decorativo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Info principal */}
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-7 h-7 text-emerald-600" />
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors duration-200">
                      {ofrenda.concepto || tipoLabels[ofrenda.tipo] || "Ofrenda"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-4">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">
                          {new Date(ofrenda.fecha).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </div>

                    {/* Metadatos con badges mejorados */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm ${tipoColors[ofrenda.tipo] || tipoColors.otro
                          }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {tipoLabels[ofrenda.tipo] || "Otro"}
                      </span>

                      {ofrenda.proyecto_nombre && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm bg-indigo-50 text-indigo-700 border-indigo-200">
                          <FolderOpen className="w-3.5 h-3.5" />
                          {ofrenda.proyecto_nombre}
                        </span>
                      )}

                      {ofrenda.nota && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm bg-amber-50 text-amber-700 border-amber-200">
                          <FileText className="w-3.5 h-3.5" />
                          {ofrenda.nota}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monto y acciones */}
              <div className="flex items-center justify-between lg:justify-end gap-6">
                {/* Monto destacado */}
                <div className="text-right lg:text-center">
                  <p className="text-xs font-medium text-slate-500 mb-1">Monto</p>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                    <p className="relative text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                      ${ofrenda.monto.toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2">
                  {/* Ver detalle */}
                  <Link
                    href={`/dashboard/comites/${comiteId}/ofrendas/${ofrenda.id}`}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 border border-blue-200 hover:border-blue-300 hover:scale-110"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  {/* Editar - solo si tiene permisos */}
                  {canManage && (
                    <Link
                      href={`/dashboard/comites/${comiteId}/ofrendas/${ofrenda.id}/editar`}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all duration-200 border border-amber-200 hover:border-amber-300 hover:scale-110"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  )}

                  {/* Eliminar - solo si tiene permisos */}
                  {canManage && (
                    <button
                      onClick={() => {
                        console.log('🗑️ Click en botón eliminar - Ofrenda ID:', ofrenda.id)
                        handleDeleteClick(ofrenda.id)
                      }}
                      disabled={deletingId === ofrenda.id}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all duration-200 border border-rose-200 hover:border-rose-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar"
                    >
                      {deletingId === ofrenda.id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay resultados filtrados */}
      {ofrendasFiltradas.length === 0 && ofrendas.length > 0 && (
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
              Intenta ajustar los filtros para ver más ofrendas
            </p>
            <button
              onClick={() => setFilters({})}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-all duration-200"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar ofrenda?"
        message="Esta ofrenda será eliminada permanentemente. Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDeleting={deletingId !== null}
      />
    </div>
  )
}
