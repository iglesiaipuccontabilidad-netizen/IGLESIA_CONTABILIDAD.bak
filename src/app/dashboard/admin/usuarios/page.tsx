'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/lib/context/AuthContext'
import { aprobarUsuario, rechazarUsuario } from '@/app/actions/usuarios'
import { Database } from '@/lib/database.types'
import { ErrorBoundary } from 'react-error-boundary'
import { useRouter } from 'next/navigation'
import { IconUserCircle, IconRefresh, IconUserCheck, IconUserX } from "@tabler/icons-react"

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
  const { user } = useAuth()
  const router = useRouter()

  // Obtener el rol del usuario actual
  const getAdminStatus = async () => {
    if (!user?.id) {
      setIsAuthorized(false)
      return false
    }

    try {
      const { data: userProfile, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single<Pick<Usuario, 'rol'>>()
      
      if (error) {
        console.error('Error al verificar permisos:', error)
        setIsAuthorized(false)
        return false
      }
      
      const isAdmin = userProfile?.rol === 'admin'
      setIsAuthorized(isAdmin)
      return isAdmin
      
    } catch (error) {
      console.error('Error al verificar permisos:', error)
      setIsAuthorized(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const cargarUsuarios = async () => {
    try {
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar usuarios:', error)
        return
      }

      setUsuarios(usuarios || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  useEffect(() => {
    if (!user) {
      return
    }

    const loadData = async () => {
      try {
        const isAdmin = await getAdminStatus()
        if (isAdmin) {
          await cargarUsuarios()
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
      }
    }

    loadData()
  }, [user])

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
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <IconUserCircle size={32} />
          Gestión de Usuarios
        </h1>
      </div>

      <div className={styles.content}>
        <div className={styles.formSection}>
          <Suspense fallback={<div>Cargando formulario...</div>}>
            <CrearUsuarioForm onSuccess={handleUserCreated} />
          </Suspense>
        </div>

        <div className={styles.listSection}>
          <Suspense fallback={<div>Cargando lista de usuarios...</div>}>
            <ErrorBoundary
        fallback={
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 animate-pulse">
            <div className="text-sm text-red-700 flex items-center gap-2">
              <IconRefresh size={20} className="animate-spin" />
              Ha ocurrido un error al cargar los usuarios
            </div>
          </div>
        }
      >
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Lista de Usuarios</h2>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Activos: {usuarios.filter(u => u.estado !== 'inactivo').length}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pendientes: {usuarios.filter(u => u.rol === 'pendiente').length}
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
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
                    {usuario.rol === 'pendiente' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={async () => {
                            try {
                              const result = await aprobarUsuario(usuario.id)
                              if (result.success) {
                                await cargarUsuarios()
                              }
                            } catch (error) {
                              console.error('Error al aprobar usuario:', error)
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
                              }
                            } catch (error) {
                              console.error('Error al rechazar usuario:', error)
                            }
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors duration-150"
                        >
                          <IconUserX size={16} style={{ marginRight: '0.375rem' }} />
                          Rechazar
                        </button>
                      </div>
                    )}
                    {usuario.estado === 'inactivo' && (
                      <button
                        onClick={async () => {
                          try {
                            const result = await aprobarUsuario(usuario.id)
                            if (result.success) {
                              await cargarUsuarios()
                            }
                          } catch (error) {
                            console.error('Error al reactivar usuario:', error)
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors duration-150"
                      >
                        <IconRefresh size={16} style={{ marginRight: '0.375rem' }} />
                        Reactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </ErrorBoundary>
          </Suspense>
        </div>
      </div>
    </div>
  )
}

