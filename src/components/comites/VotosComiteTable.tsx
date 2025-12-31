"use client"

import { useState } from "react"
import { Search, Filter, Calendar, DollarSign, User, Activity, ChevronRight, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Voto {
  id: string
  comite_miembro_id: string
  proyecto_id?: string
  monto_total: number
  monto_pagado: number
  fecha_limite: string
  concepto?: string
  estado: string
  created_at: string
  comite_miembros?: {
    id: string
    nombres: string
    apellidos: string
  }
  comite_proyectos?: {
    nombre: string
  }
}

interface VotosComiteTableProps {
  votos: Voto[]
  comiteId: string
}

export function VotosComiteTable({ votos, comiteId }: VotosComiteTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")
  const [proyectoFilter, setProyectoFilter] = useState<string>("todos")

  // Obtener lista única de proyectos
  const proyectos = Array.from(
    new Set(
      votos
        .filter((v) => v.comite_proyectos?.nombre)
        .map((v) => JSON.stringify({ id: v.proyecto_id, nombre: v.comite_proyectos?.nombre }))
    )
  ).map((str) => JSON.parse(str))

  // Filtrar votos
  const votosFiltrados = votos.filter((voto) => {
    const miembro = voto.comite_miembros
    const nombreCompleto = `${miembro?.nombres || ''} ${miembro?.apellidos || ''}`.toLowerCase()
    const concepto = voto.concepto?.toLowerCase() || ''
    const proyecto = voto.comite_proyectos?.nombre?.toLowerCase() || ''
    
    const matchSearch = nombreCompleto.includes(searchTerm.toLowerCase()) ||
                       concepto.includes(searchTerm.toLowerCase()) ||
                       proyecto.includes(searchTerm.toLowerCase())
    
    // Determinar estado real (considerar vencimiento)
    const isVencido = new Date(voto.fecha_limite) < new Date()
    const estadoReal = voto.estado === 'activo' && isVencido ? 'vencido' : voto.estado
    
    const matchEstado = estadoFilter === "todos" || estadoReal === estadoFilter
    const matchProyecto = proyectoFilter === "todos" || 
                          (proyectoFilter === "sin_proyecto" && !voto.proyecto_id) ||
                          voto.proyecto_id === proyectoFilter
    
    return matchSearch && matchEstado && matchProyecto
  })

  // Calcular estadísticas
  const totalVotos = votosFiltrados.length
  const totalMonto = votosFiltrados.reduce((sum, v) => sum + v.monto_total, 0)
  const totalPagado = votosFiltrados.reduce((sum, v) => sum + v.monto_pagado, 0)
  const porcentajePagado = totalMonto > 0 ? (totalPagado / totalMonto) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por usuario, concepto o proyecto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Filtro Estado */}
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="vencido">Vencidos</option>
                <option value="completado">Completados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>
          </div>

          {/* Filtro Proyecto */}
          <div>
            <select
              value={proyectoFilter}
              onChange={(e) => setProyectoFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
            >
              <option value="todos">Todos los proyectos</option>
              <option value="sin_proyecto">Sin proyecto</option>
              {proyectos.map((proyecto: any) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-500">Total Votos</p>
            <p className="text-lg font-bold text-slate-900">{totalVotos}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Monto Total</p>
            <p className="text-lg font-bold text-slate-900">
              ${totalMonto.toLocaleString('es-CO')}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Pagado</p>
            <p className="text-lg font-bold text-emerald-600">
              ${totalPagado.toLocaleString('es-CO')}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">% Pagado</p>
            <p className="text-lg font-bold text-cyan-600">{porcentajePagado.toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {votosFiltrados.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
          <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No se encontraron votos</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Proyecto
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Pagado
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {votosFiltrados.map((voto) => {
                  const miembro = voto.comite_miembros
                  const isVencido = new Date(voto.fecha_limite) < new Date()
                  const porcentajePagado = voto.monto_total > 0 ? (voto.monto_pagado / voto.monto_total) * 100 : 0
                  const estadoReal = voto.estado === 'activo' && isVencido ? 'vencido' : voto.estado
                  
                  // Determinar si el vencimiento está cerca (7 días)
                  const diasParaVencer = Math.ceil(
                    (new Date(voto.fecha_limite).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const vencimientoCerca = diasParaVencer <= 7 && diasParaVencer > 0

                  return (
                    <tr key={voto.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {miembro?.nombres} {miembro?.apellidos}
                            </div>
                            {voto.concepto && (
                              <div className="text-xs text-slate-500 line-clamp-1">
                                {voto.concepto}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        {voto.comite_proyectos ? (
                          <span className="inline-flex items-center gap-1 text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-200">
                            {voto.comite_proyectos.nombre}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Sin proyecto</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        <div className="text-sm font-semibold text-slate-900">
                          ${voto.monto_total.toLocaleString('es-CO')}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        <div>
                          <div className="text-sm font-semibold text-emerald-600">
                            ${voto.monto_pagado.toLocaleString('es-CO')}
                          </div>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className={`text-sm ${isVencido ? 'text-rose-600 font-medium' : vencimientoCerca ? 'text-amber-600' : 'text-slate-600'}`}>
                            {new Date(voto.fecha_limite).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        {vencimientoCerca && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                            <AlertCircle className="w-3 h-3" />
                            {diasParaVencer} día{diasParaVencer !== 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4">
                        <span
                          className={`
                            inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${estadoReal === 'activo'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : estadoReal === 'vencido'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : estadoReal === 'completado'
                              ? 'bg-primary-50 text-primary-700 border border-primary-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }
                          `}
                        >
                          <Activity className="w-3 h-3" />
                          {estadoReal === 'vencido' ? 'Vencido' : 
                           estadoReal === 'completado' ? 'Completado' :
                           estadoReal === 'cancelado' ? 'Cancelado' : 'Activo'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-right">
                        <Link
                          href={`/dashboard/comites/${comiteId}/votos/${voto.id}`}
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                        >
                          Ver detalles
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
