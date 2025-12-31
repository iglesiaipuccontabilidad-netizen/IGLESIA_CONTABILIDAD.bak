"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { asignarUsuarioComite } from "@/app/actions/comites-actions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { X, Loader2, UserPlus } from "lucide-react"

const asignarSchema = z.object({
  usuario_id: z.string().min(1, "Debes seleccionar un usuario"),
  rol: z.string().min(1, "Debes seleccionar un rol"),
  fecha_ingreso: z.string().min(1, "La fecha es requerida"),
})

type AsignarFormData = z.infer<typeof asignarSchema>

interface AsignarUsuarioModalProps {
  comiteId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AsignarUsuarioModal({
  comiteId,
  isOpen,
  onClose,
  onSuccess,
}: AsignarUsuarioModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    // resolver: zodResolver(asignarSchema),
    defaultValues: {
      usuario_id: "",
      rol: "lider",
      fecha_ingreso: new Date().toISOString().split("T")[0],
    },
  })

  // Cargar usuarios disponibles
  useEffect(() => {
    async function loadUsuarios() {
      try {
        const response = await fetch("/api/usuarios/activos")
        if (!response.ok) throw new Error("Error al cargar usuarios")
        const data = await response.json()
        setUsuarios(data.usuarios || [])
      } catch (err) {
        console.error("Error:", err)
        setError("No se pudieron cargar los usuarios")
      } finally {
        setLoadingUsuarios(false)
      }
    }
    
    loadUsuarios()
  }, [isOpen])

  const onSubmit = async (data: AsignarFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await asignarUsuarioComite({
        comite_id: comiteId,
        usuario_id: data.usuario_id,
        rol: data.rol as "lider" | "tesorero" | "secretario" | "vocal",
        fecha_ingreso: data.fecha_ingreso,
      })

      if (!result.success) {
        throw new Error(result.error || "Error al asignar usuario")
      }

      // Éxito
      if (onSuccess) {
        onSuccess()
      }
      router.refresh()
      onClose()
    } catch (err: any) {
      console.error("Error al asignar usuario:", err)
      setError(err.message || "Error al asignar usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Asignar Usuario al Comité
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200 text-sm">
              {error}
            </div>
          )}

          {/* Usuario */}
          <div>
            <label
              htmlFor="usuario_id"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Seleccionar Usuario <span className="text-rose-500">*</span>
            </label>
            {loadingUsuarios ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
              </div>
            ) : (
              <select
                {...register("usuario_id")}
                id="usuario_id"
                className={`
                  w-full px-4 py-3 rounded-lg border bg-white
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  ${errors.usuario_id ? "border-rose-300" : "border-slate-200"}
                `}
                disabled={isSubmitting}
              >
                <option value="">-- Selecciona un usuario --</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombres} {usuario.apellidos} ({usuario.email})
                  </option>
                ))}
              </select>
            )}
            {errors.usuario_id && (
              <p className="text-rose-500 text-sm mt-1">
                {errors.usuario_id.message}
              </p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label
              htmlFor="rol"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Rol en el Comité <span className="text-rose-500">*</span>
            </label>
            <select
              {...register("rol")}
              id="rol"
              className={`
                w-full px-4 py-3 rounded-lg border bg-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
                ${errors.rol ? "border-rose-300" : "border-slate-200"}
              `}
              disabled={isSubmitting}
            >
              <option value="">-- Selecciona un rol --</option>
              <option value="lider">Líder</option>
              <option value="tesorero">Tesorero</option>
              <option value="secretario">Secretario</option>
              <option value="vocal">Vocal</option>
            </select>
            {errors.rol && (
              <p className="text-rose-500 text-sm mt-1">{errors.rol.message}</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              <strong>Líder:</strong> Gestiona todo el comité<br />
              <strong>Tesorero:</strong> Maneja la contabilidad<br />
              <strong>Secretario:</strong> Maneja registros y actas<br />
              <strong>Vocal:</strong> Acceso de participación
            </p>
          </div>

          {/* Fecha de Ingreso */}
          <div>
            <label
              htmlFor="fecha_ingreso"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Fecha de Ingreso <span className="text-rose-500">*</span>
            </label>
            <input
              {...register("fecha_ingreso")}
              type="date"
              id="fecha_ingreso"
              className={`
                w-full px-4 py-3 rounded-lg border bg-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
                ${errors.fecha_ingreso ? "border-rose-300" : "border-slate-200"}
              `}
              disabled={isSubmitting}
            />
            {errors.fecha_ingreso && (
              <p className="text-rose-500 text-sm mt-1">
                {errors.fecha_ingreso.message}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || loadingUsuarios}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Asignando...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Asignar Usuario
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
