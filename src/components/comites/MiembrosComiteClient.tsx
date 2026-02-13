"use client"

import { useState } from "react"
import { ComiteMiembrosTable } from "@/components/comites/ComiteMiembrosTable"
import { ComiteMiembroForm } from "@/components/comites/ComiteMiembroForm"
import type { ComiteMiembroRow, ComiteRow } from "@/types/comites"
import { Plus, X, Users, ArrowLeft, UserCheck, UserX } from "lucide-react"
import Link from "@/components/OrgLink"

interface MiembrosComiteClientProps {
  comite: ComiteRow
  miembros: ComiteMiembroRow[]
  canEdit: boolean
}

export function MiembrosComiteClient({ comite, miembros, canEdit }: MiembrosComiteClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingMiembro, setEditingMiembro] = useState<ComiteMiembroRow | null>(null)

  const handleSuccess = () => {
    setShowForm(false)
    setEditingMiembro(null)
    // La página se recargará automáticamente con router.refresh()
  }

  const handleEdit = (miembro: ComiteMiembroRow) => {
    setEditingMiembro(miembro)
    setShowForm(true)
  }

  const handleDelete = async (miembro: ComiteMiembroRow) => {
    if (!confirm(`¿Estás seguro de eliminar a ${miembro.nombres} ${miembro.apellidos}?`)) {
      return
    }

    // TODO: Implementar eliminación (necesita action del backend)
  }

  const miembrosActivos = miembros.filter((m) => m.estado === "activo").length
  const miembrosInactivos = miembros.filter((m) => m.estado === "inactivo").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb mejorado */}
        <div className="mb-6">
          <Link
            href={`/dashboard/comites/${comite.id}`}
            className="group inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-primary-300 group-hover:bg-primary-50 transition-all duration-200">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Volver al Comité</span>
          </Link>
        </div>

        {/* Header mejorado */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              {/* Título y descripción */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-1">
                      Miembros
                    </h1>
                    <p className="text-lg text-cyan-600 font-semibold">
                      {comite.nombre}
                    </p>
                  </div>
                </div>
                <p className="text-slate-600 text-base ml-20">
                  Gestiona los miembros que pertenecen a este comité
                </p>
              </div>

              {/* Botón de acción */}
              {canEdit && !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-cyan-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Plus className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Agregar Miembro</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards - Mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Miembros */}
          <div className="group relative bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-700 rounded-2xl p-6 text-white overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 hover:-translate-y-1">
            {/* Efectos de fondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-cyan-800/30 rounded-full blur-2xl"></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              </div>
              <p className="text-cyan-100 text-sm font-medium mb-2">Total Miembros</p>
              <p className="text-4xl font-bold tracking-tight">{miembros.length}</p>
              <div className="mt-4 h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/40 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          {/* Miembros Activos */}
          <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Miembros Activos</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                {miembrosActivos}
              </p>
              <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${miembros.length > 0 ? (miembrosActivos / miembros.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Miembros Inactivos */}
          <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserX className="w-6 h-6 text-slate-500" />
                </div>
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></div>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Miembros Inactivos</p>
              <p className="text-3xl font-bold text-slate-500">
                {miembrosInactivos}
              </p>
              <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-slate-400 to-slate-500 rounded-full transition-all duration-500"
                  style={{ width: `${miembros.length > 0 ? (miembrosInactivos / miembros.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario o Tabla */}
        {showForm ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cyan-600" />
                </div>
                {editingMiembro ? "Editar Miembro" : "Agregar Nuevo Miembro"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingMiembro(null)
                }}
                className="group w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200"
              >
                <X className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
              </button>
            </div>

            <ComiteMiembroForm
              comiteId={comite.id}
              initialData={
                editingMiembro
                  ? {
                    nombres: editingMiembro.nombres,
                    apellidos: editingMiembro.apellidos,
                    telefono: editingMiembro.telefono || "",
                    email: editingMiembro.email || "",
                    fecha_ingreso: editingMiembro.fecha_ingreso,
                    estado: editingMiembro.estado as "activo" | "inactivo",
                  }
                  : undefined
              }
              miembroId={editingMiembro?.id}
              onSuccess={handleSuccess}
              onCancel={() => {
                setShowForm(false)
                setEditingMiembro(null)
              }}
            />
          </div>
        ) : (
          <ComiteMiembrosTable
            miembros={miembros}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canEdit ? handleDelete : undefined}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  )
}
