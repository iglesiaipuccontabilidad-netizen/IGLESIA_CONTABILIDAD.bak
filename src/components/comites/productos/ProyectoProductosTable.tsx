"use client"

import { useState } from "react"
import { Package, Edit, Trash2, Plus, Eye, EyeOff } from "lucide-react"
import { ProyectoProductoForm } from "./ProyectoProductoForm"

interface Producto {
  id: string
  nombre: string
  descripcion?: string
  precio_unitario: number
  estado: string
  created_at: string
}

interface ProyectoProductosTableProps {
  productos: Producto[]
  proyectoId: string
  comiteId: string
  canManage: boolean
  onRefresh?: () => void
}

export function ProyectoProductosTable({
  productos,
  proyectoId,
  comiteId,
  canManage,
  onRefresh,
}: ProyectoProductosTableProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto)
    setShowForm(true)
  }

  const handleDelete = async (productoId: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.")) {
      return
    }

    setDeletingId(productoId)
    try {
      const { deleteProyectoProducto } = await import("@/app/actions/comites-actions")
      const result = await deleteProyectoProducto(productoId)

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar producto")
      }

      if (onRefresh) onRefresh()
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      alert(error instanceof Error ? error.message : "Error al eliminar producto")
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleEstado = async (productoId: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === "activo" ? "inactivo" : "activo"

    try {
      const { updateProyectoProducto } = await import("@/app/actions/comites-actions")
      const result = await updateProyectoProducto(productoId, { estado: nuevoEstado })

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar estado")
      }

      if (onRefresh) onRefresh()
    } catch (error) {
      console.error("Error al actualizar estado:", error)
      alert(error instanceof Error ? error.message : "Error al actualizar estado")
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingProducto(null)
    if (onRefresh) onRefresh()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingProducto(null)
  }

  if (showForm) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {editingProducto ? "Editar Producto" : "Nuevo Producto"}
            </h3>
            <p className="text-sm text-slate-600">
              {editingProducto
                ? "Actualiza la información del producto"
                : "Agrega un producto al proyecto"}
            </p>
          </div>
        </div>
        <ProyectoProductoForm
          proyectoId={proyectoId}
          comiteId={comiteId}
          initialData={editingProducto ? {
            ...editingProducto,
            precio_unitario: editingProducto.precio_unitario.toString()
          } : undefined}
          productoId={editingProducto?.id}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar Producto
          </button>
        </div>
      )}

      {/* Tabla de productos */}
      {!productos || productos.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay productos</h3>
          <p className="text-slate-600 mb-4">
            Agrega productos para poder registrar ventas en este proyecto
          </p>
          {canManage && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Agregar Primer Producto
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Precio Unitario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Estado
                  </th>
                  {canManage && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {productos.map((producto) => (
                  <tr key={producto.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">{producto.nombre}</div>
                        {producto.descripcion && (
                          <div className="text-sm text-slate-500 mt-1">{producto.descripcion}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-semibold text-slate-900">
                        ${producto.precio_unitario.toLocaleString("es-CO")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {producto.estado === "activo" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleEstado(producto.id, producto.estado)}
                            className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title={
                              producto.estado === "activo" ? "Desactivar producto" : "Activar producto"
                            }
                          >
                            {producto.estado === "activo" ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(producto)}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar producto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(producto.id)}
                            disabled={deletingId === producto.id}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
