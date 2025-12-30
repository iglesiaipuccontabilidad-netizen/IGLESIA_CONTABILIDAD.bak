"use client"

import { useState } from "react"
import { ComiteMiembrosTable } from "@/components/comites/ComiteMiembrosTable"
import { ComiteMiembroForm } from "@/components/comites/ComiteMiembroForm"
import type { ComiteMiembroRow, ComiteRow } from "@/types/comites"
import { Plus, X, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

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
    console.log("Eliminar miembro:", miembro.id)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${comite.id}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Comité
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              Miembros: {comite.nombre}
            </h1>
            <p className="text-slate-600 mt-2">
              Gestiona los miembros que pertenecen a este comité
            </p>
          </div>

          {canEdit && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Agregar Miembro
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Miembros</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{miembros.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Activos</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {miembros.filter((m) => m.estado === "activo").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Inactivos</p>
              <p className="text-3xl font-bold text-slate-400 mt-1">
                {miembros.filter((m) => m.estado === "inactivo").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Formulario o Tabla */}
      {showForm ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {editingMiembro ? "Editar Miembro" : "Agregar Nuevo Miembro"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingMiembro(null)
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
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
  )
}
