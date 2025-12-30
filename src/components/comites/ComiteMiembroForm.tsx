"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createComiteMiembro } from "@/app/actions/comites-actions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, X } from "lucide-react"

const miembroSchema = z.object({
  nombres: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  apellidos: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres").optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  fecha_ingreso: z.string().min(1, "La fecha es requerida").optional(),
  estado: z.enum(["activo", "inactivo"]).default("activo"),
})

type MiembroFormData = z.infer<typeof miembroSchema>

interface ComiteMiembroFormProps {
  comiteId: string
  initialData?: Partial<MiembroFormData> & { nombres?: string; apellidos?: string; fecha_ingreso?: string }
  miembroId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ComiteMiembroForm({
  comiteId,
  initialData,
  miembroId,
  onSuccess,
  onCancel,
}: ComiteMiembroFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MiembroFormData>({
    // // resolver: zodResolver(miembroSchema), // Temporalmente deshabilitado
    defaultValues: initialData || {
      nombres: "",
      apellidos: "",
      telefono: "",
      email: "",
      fecha_ingreso: new Date().toISOString().split("T")[0],
      estado: "activo",
    },
  })

  const onSubmit = async (data: MiembroFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Validación manual de campos requeridos
      if (!data.nombres || data.nombres.trim().length < 2) {
        throw new Error("El nombre debe tener al menos 2 caracteres")
      }
      if (!data.apellidos || data.apellidos.trim().length < 2) {
        throw new Error("Los apellidos deben tener al menos 2 caracteres")
      }
      if (!data.fecha_ingreso) {
        throw new Error("La fecha de ingreso es requerida")
      }

      const result = await createComiteMiembro({
        comite_id: comiteId,
        nombres: data.nombres,
        apellidos: data.apellidos,
        telefono: data.telefono || undefined,
        email: data.email || undefined,
        fecha_ingreso: data.fecha_ingreso,
        estado: data.estado,
      })

      if (!result.success) {
        throw new Error(result.error || "Error al guardar miembro")
      }

      // Éxito
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (err: any) {
      console.error("Error al guardar miembro:", err)
      setError(err.message || "Error al guardar miembro")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Nombres y Apellidos en Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nombres" className="block text-sm font-medium text-slate-700 mb-2">
            Nombres <span className="text-rose-500">*</span>
          </label>
          <input
            {...register("nombres")}
            type="text"
            id="nombres"
            placeholder="Ej: Juan Carlos"
            className={`
              w-full px-4 py-2.5 rounded-lg border bg-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors.nombres ? "border-rose-300" : "border-slate-200"}
            `}
            disabled={isSubmitting}
          />
          {errors.nombres && (
            <p className="text-rose-500 text-xs mt-1">{errors.nombres.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="apellidos" className="block text-sm font-medium text-slate-700 mb-2">
            Apellidos <span className="text-rose-500">*</span>
          </label>
          <input
            {...register("apellidos")}
            type="text"
            id="apellidos"
            placeholder="Ej: Pérez García"
            className={`
              w-full px-4 py-2.5 rounded-lg border bg-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors.apellidos ? "border-rose-300" : "border-slate-200"}
            `}
            disabled={isSubmitting}
          />
          {errors.apellidos && (
            <p className="text-rose-500 text-xs mt-1">{errors.apellidos.message}</p>
          )}
        </div>
      </div>

      {/* Teléfono y Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-2">
            Teléfono <span className="text-slate-400">(opcional)</span>
          </label>
          <input
            {...register("telefono")}
            type="tel"
            id="telefono"
            placeholder="Ej: 300-123-4567"
            className={`
              w-full px-4 py-2.5 rounded-lg border bg-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors.telefono ? "border-rose-300" : "border-slate-200"}
            `}
            disabled={isSubmitting}
          />
          {errors.telefono && (
            <p className="text-rose-500 text-xs mt-1">{errors.telefono.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Email <span className="text-slate-400">(opcional)</span>
          </label>
          <input
            {...register("email")}
            type="email"
            id="email"
            placeholder="Ej: correo@ejemplo.com"
            className={`
              w-full px-4 py-2.5 rounded-lg border bg-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors.email ? "border-rose-300" : "border-slate-200"}
            `}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Fecha y Estado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fecha_ingreso" className="block text-sm font-medium text-slate-700 mb-2">
            Fecha de Ingreso <span className="text-rose-500">*</span>
          </label>
          <input
            {...register("fecha_ingreso")}
            type="date"
            id="fecha_ingreso"
            className={`
              w-full px-4 py-2.5 rounded-lg border bg-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors.fecha_ingreso ? "border-rose-300" : "border-slate-200"}
            `}
            disabled={isSubmitting}
          />
          {errors.fecha_ingreso && (
            <p className="text-rose-500 text-xs mt-1">{errors.fecha_ingreso.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-2">
            Estado
          </label>
          <select
            {...register("estado")}
            id="estado"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSubmitting}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-cyan-500 text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {miembroId ? "Actualizar Miembro" : "Agregar Miembro"}
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 inline mr-1" />
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
