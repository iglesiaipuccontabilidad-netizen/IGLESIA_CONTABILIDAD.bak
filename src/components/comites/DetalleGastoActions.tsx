"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"

interface DetalleGastoActionsProps {
  gastoId: string
  comiteId: string
}

export function DetalleGastoActions({ gastoId, comiteId }: DetalleGastoActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const { deleteComiteGasto } = await import("@/app/actions/comites-actions")
      const result = await deleteComiteGasto(gastoId)

      if (!result.success) {
        throw new Error(result.error || "Error al eliminar gasto")
      }

      // Redirigir a la lista de gastos
      router.push(`/dashboard/comites/${comiteId}/gastos`)
      router.refresh()
    } catch (error: any) {
      console.error("Error al eliminar gasto:", error)
      alert(error.message || "Error al eliminar gasto")
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/dashboard/comites/${comiteId}/gastos/${gastoId}/editar`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
      >
        <Edit className="w-4 h-4" />
        Editar
      </Link>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg p-2">
          <span className="text-sm text-rose-900 font-medium px-2">¿Seguro?</span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 text-white rounded text-sm font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Sí, eliminar"
            )}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isDeleting}
            className="px-3 py-1 bg-white text-slate-700 rounded text-sm font-medium hover:bg-slate-50 border border-slate-200"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
