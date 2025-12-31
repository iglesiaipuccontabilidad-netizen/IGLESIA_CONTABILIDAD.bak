"use client"

import { useState } from "react"
import { UserCog, Plus } from "lucide-react"
import { AsignarUsuarioModal } from "./AsignarUsuarioModal"

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

export function UsuariosComiteSection({ comiteId, usuarios, isAdmin }: UsuariosComiteSectionProps) {
  const [showAsignarModal, setShowAsignarModal] = useState(false)

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary-600" />
            Usuarios del Sistema ({usuarios?.length ?? 0})
          </h2>
          {isAdmin && (
            <button 
              onClick={() => setShowAsignarModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Asignar Usuario
            </button>
          )}
        </div>

        {!usuarios || usuarios.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <UserCog className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>No hay usuarios asignados a este comité</p>
          </div>
        ) : (
          <div className="space-y-3">
            {usuarios.map((usuarioComite) => (
              <div
                key={usuarioComite.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">{usuarioComite.usuario.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
                      {usuarioComite.rol}
                    </span>
                    <span className="text-xs text-slate-500">
                      Desde {new Date(usuarioComite.fecha_ingreso).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                </div>
                {usuarioComite.estado === 'activo' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Activo
                  </span>
                )}
              </div>
            ))}
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
    </>
  )
}
