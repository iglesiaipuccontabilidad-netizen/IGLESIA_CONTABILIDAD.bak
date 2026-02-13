'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/lib/context/AuthContext'
import { aprobarUsuario, rechazarUsuario, eliminarUsuario } from '@/app/actions/usuarios'
import { Database } from '@/lib/database.types'
import { ErrorBoundary } from 'react-error-boundary'
import { useRouter } from '@/lib/hooks/useOrgRouter'
import { IconUserCircle, IconRefresh, IconUserCheck, IconUserX, IconEdit, IconTrash, IconKey } from "@tabler/icons-react"
import EditarUsuarioModal from '@/components/admin/EditarUsuarioModal'
import ResetPasswordModal from '@/components/admin/ResetPasswordModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/lib/hooks/useToast'
import { LoadingWithTimeout } from '@/components/ui/LoadingWithTimeout'

// Helper para los iconos de Tabler
const Icon = ({ icon: IconComponent, size = 24, className = '' }: { icon: React.ComponentType<{ size?: number; className?: string }>; size?: number; className?: string }) => {
  return <IconComponent size={size} className={className} />
}
import styles from '@/styles/components/AdminUsuarios.module.css'
import CrearUsuarioForm from '@/components/admin/CrearUsuarioForm'

type Usuario = Database['public']['Tables']['usuarios']['Row']

export default function Page() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user, member } = useAuth()
  const router = useRouter()
  
  // Estados para modales
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Toast notifications
  const toast = useToast()

  // Obtener el rol del usuario actual desde el contexto
  const getAdminStatus = () => {
    console.log('🔍 Verificando permisos desde contexto')
    console.log('User:', user?.id, user?.email)
    console.log('Member:', member?.id, member?.email, member?.rol, member?.estado)

    if (!user?.id || !member) {
      console.log('❌ No hay user o member en el contexto')
      setIsAuthorized(false)
      setIsLoading(false)
      return false
    }

    const isAdmin = member.rol === 'admin' && member.estado === 'activo'
    console.log('🔐 Es admin?', isAdmin, '(rol:', member.rol, ', estado:', member.estado, ')')
    setIsAuthorized(isAdmin)
    setIsLoading(false)
    return isAdmin
  }

  const cargarUsuarios = async () => {
    try {
      console.log('📥 Cargando usuarios...')
      
      // FASE 1: Agregar timeout de 10s a la query usando Promise.race
      const queryPromise = supabase
        .from('usuarios')
        .select('*')
        .neq('estado', 'inactivo') // Excluir usuarios eliminados (soft delete)
        .order('created_at', { ascending: false })
      
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout al cargar usuarios después de 10 segundos')), 10000)
      )
      
      const result = await Promise.race([queryPromise, timeoutPromise])
      const { data: usuarios, error } = result as any

      if (error) {
        console.error('❌ Error al cargar usuarios:', error)
        toast.error('Error al cargar usuarios: ' + error.message)
        setIsLoading(false) // Asegurar que se finaliza el loading
        return
      }

      console.log('✅ Usuarios cargados:', usuarios?.length || 0, usuarios)
      setUsuarios(usuarios || [])
    } catch (error: any) {
      console.error('❌ Error al cargar datos:', error)
      toast.error(error?.message || 'Error al cargar los datos')
      setIsLoading(false) // Asegurar que se finaliza el loading
    }
  }

  useEffect(() => {
    if (!user || !member) {
      console.log('⏳ Esperando user y member...')
      return
    }

    const loadData = async () => {
      try {
        const isAdmin = getAdminStatus()
        if (isAdmin) {
          await cargarUsuarios()
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
      }
    }

    loadData()
  }, [user, member])

  const getEstadoBadgeVariant = (rol: string, estado: string) => {
    if (estado === 'inactivo') return 'destructive'
    if (rol === 'pendiente') return 'warning'
    if (rol === 'admin') return 'premium'
    return 'success'
  }

  const getEstadoIcon = (rol: string, estado: string) => {
    if (estado === 'inactivo') return <IconUserX width={16} height={16} />
    if (rol === 'pendiente') return <IconUserCircle width={16} height={16} />
    if (rol === 'admin') return <IconUserCheck width={16} height={16} stroke={1.5} className="text-purple-500" />
    return <IconUserCheck width={16} height={16} stroke={1.5} className="text-green-500" />
  }

  const handleUserCreated = () => {
    // Recargar la lista de usuarios
    cargarUsuarios()
    toast.success('Usuario creado exitosamente')
  }

  const handleEditClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    cargarUsuarios()
    toast.success('Usuario actualizado exitosamente')
  }

  const handleDeleteClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setDeleteDialogOpen(true)
  }

  const handleResetPasswordClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setResetPasswordModalOpen(true)
  }

  const handleResetPasswordSuccess = () => {
    toast.success('Contraseña reseteada exitosamente')
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUsuario) return

    setIsDeleting(true)
    try {
      const result = await eliminarUsuario(selectedUsuario.id, true) // soft delete
      
      if (result.success) {
        await cargarUsuarios()
        toast.success('Usuario eliminado exitosamente')
        setDeleteDialogOpen(false)
        setSelectedUsuario(null)
      } else {
        toast.error(result.error || 'Error al eliminar el usuario')
      }
    } catch (error) {
      toast.error('Error al eliminar el usuario')
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    if (isAuthorized === false) {
      router.replace('/dashboard')
    }
  }, [isAuthorized, router])

  if (isLoading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-4 rounded-lg bg-gray-50 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span className="text-sm text-gray-600">Verificando permisos...</span>
        </div>
      </div>
    )
  }
  
  if (isAuthorized === false) {
    return null // La redirección se maneja en el useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500 rounded-lg">
            <IconUserCircle size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-600">Administra roles y permisos del equipo</p>
          </div>
        </div>
      </div>

      {/* Layout responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de creación */}
        <div className="lg:col-span-1">
          <Suspense fallback={<div className="animate-pulse bg-white rounded-xl h-64"></div>}>
            <CrearUsuarioForm onSuccess={handleUserCreated} />
          </Suspense>
        </div>

        {/* Lista de usuarios */}
        <div className="lg:col-span-2">
          <Suspense fallback={
            <div className="grid grid-cols-1 gap-4">
              {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white rounded-xl h-32"></div>)}
            </div>
          }>
            <ErrorBoundary
              fallback={
                <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                  <div className="text-sm text-red-700 flex items-center gap-2">
                    <IconRefresh size={20} className="animate-spin" />
                    Ha ocurrido un error al cargar los usuarios
                  </div>
                </div>
              }
            >
              <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                {/* Header con estadísticas */}
                <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">Lista de Usuarios</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Activos: {usuarios.filter(u => u.estado !== 'inactivo').length}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Pendientes: {usuarios.filter(u => u.rol === 'pendiente').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vista de tabla para desktop */}
                <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-white">
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</div>
                  <div className="text-xs text-gray-400 mt-0.5">Identificador único</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</div>
                  <div className="text-xs text-gray-400 mt-0.5">Correo electrónico</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</div>
                  <div className="text-xs text-gray-400 mt-0.5">Rol y actividad</div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</div>
                  <div className="text-xs text-gray-400 mt-0.5">Gestionar usuario</div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getEstadoIcon(usuario.rol || '', usuario.estado || '')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {usuario.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{usuario.email}</div>
                    <div className="text-xs text-gray-500">Correo electrónico</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      usuario.estado === 'inactivo'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : usuario.rol === 'admin'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : usuario.rol === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        usuario.estado === 'inactivo'
                          ? 'bg-red-400'
                          : usuario.rol === 'admin'
                          ? 'bg-purple-400'
                          : usuario.rol === 'pendiente'
                          ? 'bg-yellow-400'
                          : 'bg-green-400'
                      }`}></span>
                      {usuario.estado === 'inactivo'
                        ? 'Inactivo'
                        : usuario.rol === 'admin'
                        ? 'Administrador'
                        : usuario.rol === 'pendiente'
                        ? 'Pendiente'
                        : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {/* Botones principales siempre visibles */}
                      <button
                        onClick={() => handleEditClick(usuario)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors duration-150"
                        title="Editar usuario"
                      >
                        <IconEdit size={16} style={{ marginRight: '0.375rem' }} />
                        Editar
                      </button>
                      
                      <button
                        onClick={() => handleResetPasswordClick(usuario)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-colors duration-150"
                        title="Resetear contraseña"
                      >
                        <IconKey size={16} style={{ marginRight: '0.375rem' }} />
                        Reset
                      </button>
                      
                      {usuario.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteClick(usuario)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors duration-150"
                          title="Eliminar usuario"
                        >
                          <IconTrash size={16} style={{ marginRight: '0.375rem' }} />
                          Eliminar
                        </button>
                      )}

                      {/* Botones específicos por estado */}
                      {usuario.rol === 'pendiente' && (
                        <>
                          <button 
                            onClick={async () => {
                              try {
                                const result = await aprobarUsuario(usuario.id)
                                if (result.success) {
                                  await cargarUsuarios()
                                  toast.success('Usuario aprobado')
                                }
                              } catch (error) {
                                toast.error('Error al aprobar usuario')
                              }
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors duration-150"
                          >
                            <IconUserCheck size={16} style={{ marginRight: '0.375rem' }} />
                            Aprobar
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const result = await rechazarUsuario(usuario.id)
                                if (result.success) {
                                  await cargarUsuarios()
                                  toast.success('Usuario rechazado')
                                }
                              } catch (error) {
                                toast.error('Error al rechazar usuario')
                              }
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors duration-150"
                          >
                            <IconUserX size={16} style={{ marginRight: '0.375rem' }} />
                            Rechazar
                          </button>
                        </>
                      )}
                      {usuario.estado === 'inactivo' && usuario.rol !== 'pendiente' && (
                        <button
                          onClick={async () => {
                            try {
                              const result = await aprobarUsuario(usuario.id)
                              if (result.success) {
                                await cargarUsuarios()
                                toast.success('Usuario reactivado')
                              }
                            } catch (error) {
                              toast.error('Error al reactivar usuario')
                            }
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors duration-150"
                        >
                          <IconRefresh size={16} style={{ marginRight: '0.375rem' }} />
                          Reactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
                </div>

                {/* Vista de tarjetas para móvil */}
                <div className="md:hidden divide-y divide-gray-200">
                  {usuarios.map((usuario) => (
                    <div key={usuario.id} className="p-4 hover:bg-gray-50 transition-colors">
                      {/* Header de la tarjeta */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {getEstadoIcon(usuario.rol || '', usuario.estado || '')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{usuario.email}</p>
                            <p className="text-xs text-gray-500 truncate">{usuario.id}</p>
                          </div>
                        </div>
                      </div>

                      {/* Estado */}
                      <div className="mb-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          usuario.estado === 'inactivo'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : usuario.rol === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : usuario.rol === 'pendiente'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            usuario.estado === 'inactivo'
                              ? 'bg-red-400'
                              : usuario.rol === 'admin'
                              ? 'bg-purple-400'
                              : usuario.rol === 'pendiente'
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                          }`}></span>
                          {usuario.estado === 'inactivo'
                            ? 'Inactivo'
                            : usuario.rol === 'admin'
                            ? 'Administrador'
                            : usuario.rol === 'pendiente'
                            ? 'Pendiente'
                            : 'Usuario'}
                        </span>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-2">
                        {/* Botones principales */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleEditClick(usuario)}
                            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 active:bg-blue-200 transition-colors"
                          >
                            <IconEdit size={16} className="mr-1.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleResetPasswordClick(usuario)}
                            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 active:bg-purple-200 transition-colors"
                          >
                            <IconKey size={16} className="mr-1.5" />
                            Reset
                          </button>
                          {usuario.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteClick(usuario)}
                              className="col-span-2 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 active:bg-red-200 transition-colors"
                            >
                              <IconTrash size={16} className="mr-1.5" />
                              Eliminar
                            </button>
                          )}
                        </div>

                        {/* Botones específicos por estado */}
                        {usuario.rol === 'pendiente' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                try {
                                  const result = await aprobarUsuario(usuario.id)
                                  if (result.success) {
                                    await cargarUsuarios()
                                    toast.success('Usuario aprobado')
                                  }
                                } catch (error) {
                                  toast.error('Error al aprobar usuario')
                                }
                              }}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 active:bg-green-200 transition-colors"
                            >
                              <IconUserCheck size={16} className="mr-1.5" />
                              Aprobar
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const result = await rechazarUsuario(usuario.id)
                                  if (result.success) {
                                    await cargarUsuarios()
                                    toast.success('Usuario rechazado')
                                  }
                                } catch (error) {
                                  toast.error('Error al rechazar usuario')
                                }
                              }}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 active:bg-red-200 transition-colors"
                            >
                              <IconUserX size={16} className="mr-1.5" />
                              Rechazar
                            </button>
                          </div>
                        )}
                        {usuario.estado === 'inactivo' && usuario.rol !== 'pendiente' && (
                          <button
                            onClick={async () => {
                              try {
                                const result = await aprobarUsuario(usuario.id)
                                if (result.success) {
                                  await cargarUsuarios()
                                  toast.success('Usuario reactivado')
                                }
                              } catch (error) {
                                toast.error('Error al reactivar usuario')
                              }
                            }}
                            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 active:bg-green-200 transition-colors"
                          >
                            <IconRefresh size={16} className="mr-1.5" />
                            Reactivar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>

      {/* Modales */}
      <EditarUsuarioModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedUsuario(null)
        }}
        usuario={selectedUsuario}
        onSuccess={handleEditSuccess}
      />

      <ResetPasswordModal
        isOpen={resetPasswordModalOpen}
        onClose={() => {
          setResetPasswordModalOpen(false)
          setSelectedUsuario(null)
        }}
        userEmail={selectedUsuario?.email || ''}
        userId={selectedUsuario?.id || ''}
        onSuccess={handleResetPasswordSuccess}
      />

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que deseas eliminar al usuario ${selectedUsuario?.email}? Esta acción desactivará la cuenta.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setSelectedUsuario(null)
        }}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </div>
  )
}

