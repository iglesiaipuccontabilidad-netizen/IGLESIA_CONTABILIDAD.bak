"use client"

import { useState, useMemo } from "react"
import { UserCog, Plus, Crown, DollarSign, FileText, Users, Search, X, Trash2, AlertCircle, Edit2 } from "lucide-react"
import { AsignarUsuarioModal } from "./AsignarUsuarioModal"
import { removerUsuarioComite, actualizarRolUsuarioComite } from "@/app/actions/comites-actions"
import { toast } from "sonner"

interface Usuario {
  id: string
  usuario_id: string
  rol: string
  estado: string
  fecha_ingreso: string
  usuario: {
    id: string
    email: string | null
    rol: string | null
  }
}

interface UsuariosComiteSectionProps {
  comiteId: string
  usuarios: Usuario[] | null
  isAdmin: boolean
}

type ComiteRol = 'lider' | 'tesorero' | 'secretario' | 'vocal'

interface RolInfo {
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
}

const ROL_INFO: Record<ComiteRol, RolInfo> = {
  lider: {
    label: 'Líder',
    icon: <Crown className="w-4 h-4" />,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  tesorero: {
    label: 'Tesorero',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  secretario: {
    label: 'Secretario',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  vocal: {
    label: 'Vocal',
    icon: <Users className="w-4 h-4" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
}

export function UsuariosComiteSection({ comiteId, usuarios, isAdmin }: UsuariosComiteSectionProps) {
  const [showAsignarModal, setShowAsignarModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRol, setFilterRol] = useState<ComiteRol | "todos">("todos")
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<string | null>(null)
  const [usuarioAEditar, setUsuarioAEditar] = useState<Usuario | null>(null)
  const [nuevoRol, setNuevoRol] = useState<ComiteRol | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Orden de roles a mostrar
  const rolesOrder: ComiteRol[] = ['lider', 'tesorero', 'secretario', 'vocal']

  // Filtrar usuarios por búsqueda y rol
  const usuariosFiltrados = useMemo(() => {
    let result = usuarios || []
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      result = result.filter(u => 
        u.usuario.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por rol
    if (filterRol !== "todos") {
      result = result.filter(u => u.rol === filterRol)
    }

    return result
  }, [usuarios, searchTerm, filterRol])

  // Agrupar usuarios por rol
  const usuariosPorRol = useMemo(() => {
    return (usuariosFiltrados || []).reduce((acc, usuario) => {
      const rol = (usuario.rol as ComiteRol) || 'vocal'
      if (!acc[rol]) {
        acc[rol] = []
      }
      acc[rol].push(usuario)
      return acc
    }, {} as Record<ComiteRol, Usuario[]>)
  }, [usuariosFiltrados])

  // Contadores por rol
  const contadoresPorRol = useMemo(() => {
    return rolesOrder.reduce((acc, rol) => {
      acc[rol] = (usuarios || []).filter(u => u.rol === rol).length
      return acc
    }, {} as Record<ComiteRol, number>)
  }, [usuarios])

  const handleRemoverUsuario = async (usuarioComiteId: string, usuarioId: string) => {
    setIsDeleting(true)
    try {
      const result = await removerUsuarioComite(usuarioComiteId, usuarioId)
      
      if (result.success) {
        toast.success("Usuario removido del comité exitosamente")
        setUsuarioAEliminar(null)
        // Recargar la página para actualizar la lista
        window.location.reload()
      } else {
        toast.error(result.error || "Error al remover usuario")
      }
    } catch (error) {
      toast.error("Error inesperado al remover usuario")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleActualizarRol = async () => {
    if (!usuarioAEditar || !nuevoRol) return
    
    setIsUpdating(true)
    try {
      const result = await actualizarRolUsuarioComite(comiteId, usuarioAEditar.usuario_id, nuevoRol)
      
      if (result.success) {
        toast.success("Rol actualizado exitosamente")
        setUsuarioAEditar(null)
        setNuevoRol(null)
        // Recargar la página para actualizar la lista
        window.location.reload()
      } else {
        toast.error(result.error || "Error al actualizar rol")
      }
    } catch (error) {
      toast.error("Error inesperado al actualizar rol")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary-600" />
            Miembros del Comité ({usuarios?.length ?? 0})
          </h2>
          {isAdmin && (
            <button 
              onClick={() => setShowAsignarModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Asignar Miembro
            </button>
          )}
        </div>

        {!usuarios || usuarios.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <UserCog className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>No hay miembros asignados a este comité</p>
          </div>
        ) : (
          <div className="space-y-6">
            {rolesOrder.map((rol) => {
              const usuariosDelRol = usuariosPorRol[rol] || []
              if (usuariosDelRol.length === 0) return null

              const info = ROL_INFO[rol]

              return (
                <div key={rol}>
                  <div className={`flex items-center gap-2 mb-3 pb-3 border-b-2 ${info.borderColor}`}>
                    <div className={`${info.color}`}>
                      {info.icon}
                    </div>
                    <h3 className={`text-lg font-semibold ${info.color}`}>
                      {info.label} ({usuariosDelRol.length})
                    </h3>
                  </div>

                  <div className="space-y-3 pl-6">
                    {usuariosDelRol.map((usuarioComite) => (
                      <div
                        key={usuarioComite.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${info.bgColor} ${info.borderColor} hover:shadow-sm transition-shadow`}
                      >
                        <div>
                          <p className="font-medium text-slate-900">{usuarioComite.usuario.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">
                              Desde {new Date(usuarioComite.fecha_ingreso).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {usuarioComite.estado === 'activo' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Activo
                            </span>
                          )}
                          {isAdmin && usuarioComite.estado === 'activo' && (
                            <>
                              <button
                                onClick={() => {
                                  setUsuarioAEditar(usuarioComite)
                                  setNuevoRol(usuarioComite.rol as ComiteRol)
                                }}
                                className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                                title="Editar rol"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setUsuarioAEliminar(usuarioComite.id)}
                                className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                title="Remover del comité"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAsignarModal && (
        <AsignarUsuarioModal
          comiteId={comiteId}
          isOpen={showAsignarModal}
          onClose={() => setShowAsignarModal(false)}
          onSuccess={() => {
            setShowAsignarModal(false)
            // Recargar la página
            window.location.reload()
          }}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      {usuarioAEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  ¿Remover usuario del comité?
                </h3>
                <p className="text-sm text-slate-600">
                  El usuario será marcado como inactivo en este comité. Esta acción puede revertirse.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setUsuarioAEliminar(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const usuario = usuarios?.find(u => u.id === usuarioAEliminar)
                  if (usuario) {
                    handleRemoverUsuario(usuario.id, usuario.usuario_id)
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Removiendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de rol */}
      {usuarioAEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Editar Rol de Usuario
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                {usuarioAEditar.usuario.email}
              </p>
              
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nuevo Rol
              </label>
              <select
                value={nuevoRol || ''}
                onChange={(e) => setNuevoRol(e.target.value as ComiteRol)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {rolesOrder.map((rol) => (
                  <option key={rol} value={rol}>
                    {ROL_INFO[rol].label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setUsuarioAEditar(null)
                  setNuevoRol(null)
                }}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleActualizarRol}
                disabled={isUpdating || !nuevoRol}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Actualizar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
