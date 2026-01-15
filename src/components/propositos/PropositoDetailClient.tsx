'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit, TrendingUp, Target, Calendar, Users, DollarSign, Trash2, AlertTriangle } from 'lucide-react'
import { deleteProposito } from '@/app/actions/propositos-actions'
import toast from 'react-hot-toast'
import type { Database } from '@/lib/database.types'

type Proposito = Database['public']['Tables']['propositos']['Row']

// Tipo para votos con miembro incluido (lo que realmente devuelve la query)
type VotoConMiembro = Database['public']['Tables']['votos']['Row'] & {
  miembro: {
    id: string
    nombres: string
    apellidos: string
  } | null
}

interface PropositoDetailClientProps {
  proposito: Proposito
  votos: VotoConMiembro[]
  userRole: string
}

export default function PropositoDetailClient({ proposito, votos, userRole }: PropositoDetailClientProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const progreso = proposito.monto_objetivo
    ? Math.min(Math.round((proposito.monto_recaudado / proposito.monto_objetivo) * 100), 100)
    : 0

  const montoPendiente = proposito.monto_objetivo
    ? proposito.monto_objetivo - proposito.monto_recaudado
    : 0

  const estadoBadge = proposito.estado === 'activo'
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : proposito.estado === 'completado'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-gray-100 text-gray-800 border-gray-200'

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteProposito(proposito.id)

    if (result.success) {
      toast.success('Propósito eliminado exitosamente', { id: 'delete-proposito' })
      // Redirigir a la lista de propósitos
      window.location.href = '/dashboard/propositos'
    } else {
      toast.error(result.error?.message || 'Error al eliminar el propósito', { id: 'delete-proposito' })
      setShowDeleteModal(false)
    }
    setIsDeleting(false)
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard/propositos"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a propósitos
          </Link>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/propositos/${proposito.id}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Link>
            {userRole === 'admin' && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 font-medium rounded-xl hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {proposito.nombre}
              </h1>
              {proposito.descripcion && (
                <p className="text-slate-600">
                  {proposito.descripcion}
                </p>
              )}
            </div>
            <span className={`px-4 py-2 text-sm font-medium rounded-full border ${estadoBadge}`}>
              {proposito.estado}
            </span>
          </div>

          {proposito.monto_objetivo && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Progreso del propósito</span>
                <span className="text-2xl font-bold text-slate-900">{progreso}%</span>
              </div>

              <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${progreso}%` }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">Recaudado</p>
                    <p className="text-2xl font-bold text-green-900">
                      ${proposito.monto_recaudado.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Objetivo</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ${proposito.monto_objetivo.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-700 font-medium">Pendiente</p>
                    <p className="text-2xl font-bold text-orange-900">
                      ${montoPendiente.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {proposito.fecha_fin && (
            <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">
                Finaliza: {new Date(proposito.fecha_fin).toLocaleDateString('es-CO')}
              </span>
            </div>
          )}
        </div>

        {/* Votos asociados */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Votos asociados ({votos.length})
            </h2>
            <Link
              href={`/dashboard/votos/nuevo?proposito=${proposito.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              Nuevo voto
            </Link>
          </div>

          {votos.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No hay votos asociados a este propósito</p>
              <Link
                href={`/dashboard/votos/nuevo?proposito=${proposito.id}`}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Crear el primer voto
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {votos.map((voto) => (
                <div key={voto.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {voto.miembro ? `${voto.miembro.nombres} ${voto.miembro.apellidos}` : 'Sin asignar'}
                      </p>
                      <p className="text-sm text-slate-600">
                        ${voto.monto_total.toLocaleString('es-CO')} - {voto.estado}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/votos/${voto.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver detalles
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Eliminar Propósito</h3>
                <p className="text-sm text-slate-600">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-slate-700 mb-2">
                ¿Estás seguro de que quieres eliminar el propósito <strong>"{proposito.nombre}"</strong>?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Nota:</strong> Solo puedes eliminar propósitos que no tengan votos asociados.
                  Si este propósito tiene votos, primero debes eliminarlos individualmente.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}