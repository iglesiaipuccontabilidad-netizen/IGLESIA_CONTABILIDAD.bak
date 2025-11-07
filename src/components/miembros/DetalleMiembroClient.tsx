'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, LogOut } from 'lucide-react'
import { DeleteConfirmation } from './DeleteConfirmation'
import { eliminarMiembro } from '@/app/actions/miembros'
import { logout } from '@/app/login/actions'
import toast from 'react-hot-toast'

interface Voto {
  id: string
  proposito: string
  monto_total: number
  recaudado: number
  estado: string
  fecha_limite: string
}

interface MiembroData {
  id: string
  nombres: string
  apellidos: string
  cedula: string
  email: string | null
  telefono: string | null
  fecha_ingreso: string
  estado: string
  votos?: Voto[]
}

interface DetalleMiembroClientProps {
  miembro: MiembroData
}

export default function DetalleMiembroClient({ miembro }: DetalleMiembroClientProps) {
  const router = useRouter()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Link 
            href="/dashboard/miembros" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la lista de miembros
          </Link>

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
          </form>
        </div>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {miembro.nombres} {miembro.apellidos}
            </h1>
            <p className="text-gray-500 mt-1">
              Cédula: {miembro.cedula}
            </p>
          </div>
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${miembro.estado === 'activo' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
            }
          `}>
            {miembro.estado}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna de información personal */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información Personal
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombres
                  </label>
                  <p className="mt-1 text-gray-900">{miembro.nombres}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Apellidos
                  </label>
                  <p className="mt-1 text-gray-900">{miembro.apellidos}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-gray-900">{miembro.email || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <p className="mt-1 text-gray-900">{miembro.telefono || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha de Ingreso
                  </label>
                  <p className="mt-1 text-gray-900">
                    {new Date(miembro.fecha_ingreso).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de votos */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Votos Activos
                </h2>
                <Link
                  href={`/dashboard/votos/nuevo?miembro=${miembro.id}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Nuevo Voto
                </Link>
              </div>

              <div className="space-y-4">
                {miembro.votos && miembro.votos.length > 0 ? (
                  miembro.votos.map((voto) => (
                    <Link 
                      href={`/dashboard/votos/${voto.id}`}
                      key={voto.id}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-200 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {voto.proposito}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Vence el {new Date(voto.fecha_limite).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <span className={`
                          px-2 py-1 text-xs rounded-full
                          ${voto.estado === 'activo' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-gray-100 text-gray-800'
                          }
                        `}>
                          {voto.estado}
                        </span>
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Progreso</span>
                          <span className="font-medium">
                            {Math.round((voto.recaudado / voto.monto_total) * 100)}%
                          </span>
                        </div>
                        <div className="mt-1 w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-all"
                            style={{
                              width: `${(voto.recaudado / voto.monto_total) * 100}%`
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                          <span>
                            Meta: {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            }).format(voto.monto_total)}
                          </span>
                          <span>
                            Progreso: {Math.round((voto.recaudado / voto.monto_total) * 100)}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No hay votos activos para mostrar.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columna de acciones */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Acciones
              </h2>

              {/* Botones de acción */}
              <div className="space-y-3">
                <Link
                  href={`/dashboard/miembros/${miembro.id}/edit`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Editar Información
                </Link>
                
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  Eliminar Miembro
                </button>
              </div>

              {/* Estadísticas */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Estadísticas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Votos Activos</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {miembro.votos?.filter(v => v.estado === 'activo').length || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Total Comprometido</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(
                        miembro.votos?.reduce((total, voto) => total + voto.monto_total, 0) || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          try {
            await eliminarMiembro(miembro.id);
            router.push('/dashboard/miembros');
            toast.success('Miembro eliminado con éxito');
          } catch (error) {
            toast.error('Error al eliminar el miembro');
            console.error(error);
          }
        }}
        nombre={`${miembro.nombres} ${miembro.apellidos}`}
      />
    </div>
  )
}
