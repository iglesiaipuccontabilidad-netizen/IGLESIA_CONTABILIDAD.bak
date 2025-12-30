"use client"

import { useState } from "react"
import { Search, Phone, Mail, Calendar, Trash2, Edit, Activity } from "lucide-react"
import type { ComiteMiembroRow } from "@/types/comites"

interface ComiteMiembrosTableProps {
  miembros: ComiteMiembroRow[]
  onEdit?: (miembro: ComiteMiembroRow) => void
  onDelete?: (miembro: ComiteMiembroRow) => void
  canEdit?: boolean
}

export function ComiteMiembrosTable({
  miembros,
  onEdit,
  onDelete,
  canEdit = true,
}: ComiteMiembrosTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<"all" | "activo" | "inactivo">("all")

  // Filtrar miembros
  const filteredMiembros = miembros.filter((miembro) => {
    const matchesSearch =
      miembro.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      miembro.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      miembro.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      miembro.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEstado = estadoFilter === "all" || miembro.estado === estadoFilter

    return matchesSearch && matchesEstado
  })

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Filtro de Estado */}
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Todos los estados</option>
          <option value="activo">Solo activos</option>
          <option value="inactivo">Solo inactivos</option>
        </select>
      </div>

      {/* Contador */}
      <div className="text-sm text-slate-600">
        Mostrando <span className="font-semibold">{filteredMiembros.length}</span> de{" "}
        <span className="font-semibold">{miembros.length}</span> miembros
      </div>

      {/* Tabla Responsive */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredMiembros.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No se encontraron miembros</p>
            <p className="text-sm mt-1">Intenta cambiar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Miembro
                  </th>
                  <th className="text-left px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="text-left px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Fecha Ingreso
                  </th>
                  <th className="text-left px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Estado
                  </th>
                  {canEdit && (
                    <th className="text-right px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMiembros.map((miembro) => {
                  const isActivo = miembro.estado === "activo"

                  return (
                    <tr key={miembro.id} className="hover:bg-slate-50 transition-colors">
                      {/* Nombre */}
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-semibold">
                            {miembro.nombres.charAt(0)}
                            {miembro.apellidos.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {miembro.nombres} {miembro.apellidos}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        <div className="space-y-1">
                          {miembro.telefono && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-3.5 h-3.5" />
                              {miembro.telefono}
                            </div>
                          )}
                          {miembro.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="w-3.5 h-3.5" />
                              {miembro.email}
                            </div>
                          )}
                          {!miembro.telefono && !miembro.email && (
                            <span className="text-sm text-slate-400">Sin contacto</span>
                          )}
                        </div>
                      </td>

                      {/* Fecha Ingreso */}
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(miembro.fecha_ingreso).toLocaleDateString("es-CO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        <span
                          className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                            ${
                              isActivo
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }
                          `}
                        >
                          <Activity className="w-3 h-3" />
                          {isActivo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* Acciones */}
                      {canEdit && (
                        <td className="px-3 sm:px-6 py-2 sm:py-4">
                          <div className="flex items-center justify-end gap-2">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(miembro)}
                                className="p-3 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                                title="Editar miembro"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(miembro)}
                                className="p-3 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Eliminar miembro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
