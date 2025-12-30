"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, X } from "lucide-react"

const proyectoSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  descripcion: z.string().optional(),
  monto_objetivo: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  estado: z.enum(["activo", "completado", "cancelado"]).default("activo"),
})

type ProyectoFormData = z.infer<typeof proyectoSchema>

interface ComiteProyectoFormProps {
  comiteId: string
  initialData?: Partial<ProyectoFormData & { monto_recaudado?: number }>
  proyectoId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ComiteProyectoForm({
  comiteId,
  initialData,
  proyectoId,
  onSuccess,
  onCancel,
}: ComiteProyectoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: initialData?.nombre || "",
      descripcion: initialData?.descripcion || "",
      monto_objetivo: initialData?.monto_objetivo || "",
      fecha_inicio: initialData?.fecha_inicio || "",
      fecha_fin: initialData?.fecha_fin || "",
      estado: (initialData?.estado || "activo") as "activo" | "completado" | "cancelado",
    },
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Preparar datos
      const payload = {
        comite_id: comiteId,
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        monto_objetivo: data.monto_objetivo ? parseFloat(data.monto_objetivo) : undefined,
        fecha_inicio: data.fecha_inicio || undefined,
        fecha_fin: data.fecha_fin || undefined,
        estado: data.estado,
      }

      // Llamar a la action del servidor
      const { createComiteProyecto, updateComiteProyecto } = await import("@/app/actions/comites-actions")
      
      const result = proyectoId
        ? await updateComiteProyecto(proyectoId, payload)
        : await createComiteProyecto(payload)

      if (!result.success) {
        throw new Error(result.error || "Error al guardar proyecto")
      }

      // Éxito
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/dashboard/comites/${comiteId}/proyectos`)
        router.refresh()
      }
    } catch (err: any) {
      console.error("Error al guardar proyecto:", err)
      setError(err.message || "Error al guardar proyecto")
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

      {/* Nombre */}
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-2">
          Nombre del Proyecto <span className="text-rose-500">*</span>
        </label>
        <input
          {...register("nombre")}
          type="text"
          id="nombre"
          placeholder="Ej: Retiro Jóvenes 2025, Campamento de Verano..."
          className={`
            w-full px-4 py-2.5 rounded-lg border bg-white
            focus:outline-none focus:ring-2 focus:ring-primary-500
            ${errors.nombre ? "border-rose-300" : "border-slate-200"}
          `}
          disabled={isSubmitting}
        />
        {errors.nombre && (
          <p className="text-rose-500 text-xs mt-1">{errors.nombre.message}</p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-2">
          Descripción <span className="text-slate-400">(opcional)</span>
        </label>
        <textarea
          {...register("descripcion")}
          id="descripcion"
          rows={4}
          placeholder="Describe los objetivos y actividades del proyecto..."
          className={`
            w-full px-4 py-2.5 rounded-lg border bg-white
            focus:outline-none focus:ring-2 focus:ring-primary-500
            ${errors.descripcion ? "border-rose-300" : "border-slate-200"}
          `}
          disabled={isSubmitting}
        />
        {errors.descripcion && (
          <p className="text-rose-500 text-xs mt-1">{errors.descripcion.message}</p>
        )}
      </div>

      {/* Monto Objetivo */}
      <div>
        <label htmlFor="monto_objetivo" className="block text-sm font-medium text-slate-700 mb-2">
          Monto Objetivo <span className="text-slate-400">(opcional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <input
            {...register("monto_objetivo")}
            type="number"
            id="monto_objetivo"
            step="0.01"
            placeholder="0"
            className={`
              w-full pl-8 pr-4 py-2.5 rounded-lg border bg-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors.monto_objetivo ? "border-rose-300" : "border-slate-200"}
            `}
            disabled={isSubmitting}
          />
        </div>
        {errors.monto_objetivo && (
          <p className="text-rose-500 text-xs mt-1">{errors.monto_objetivo.message}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Monto que se espera recaudar para este proyecto
        </p>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fecha_inicio" className="block text-sm font-medium text-slate-700 mb-2">
            Fecha de Inicio <span className="text-slate-400">(opcional)</span>
          </label>
          <input
            {...register("fecha_inicio")}
            type="date"
            id="fecha_inicio"
            className={`
              w-full px-4 py-2.5 rounded-lg border bg-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors.fecha_inicio ? "border-rose-300" : "border-slate-200"}
            `}
            disabled={isSubmitting}
          />
          {errors.fecha_inicio && (
            <p className="text-rose-500 text-xs mt-1">{errors.fecha_inicio.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="fecha_fin" className="block text-sm font-medium text-slate-700 mb-2">
            Fecha de Fin <span className="text-slate-400">(opcional)</span>
          </label>
          <input
            {...register("fecha_fin")}
            type="date"
            id="fecha_fin"
            className={`
              w-full px-4 py-2.5 rounded-lg border bg-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors.fecha_fin ? "border-rose-300" : "border-slate-200"}
            `}
            disabled={isSubmitting}
          />
          {errors.fecha_fin && (
            <p className="text-rose-500 text-xs mt-1">{errors.fecha_fin.message}</p>
          )}
        </div>
      </div>

      {/* Estado */}
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
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Monto Recaudado (solo mostrar si existe) */}
      {initialData?.monto_recaudado !== undefined && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <p className="text-sm text-primary-900 font-medium mb-1">Monto Recaudado</p>
          <p className="text-2xl font-bold text-primary-600">
            ${initialData.monto_recaudado.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-primary-700 mt-1">
            Este monto se actualiza automáticamente con los pagos de votos asociados
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {proyectoId ? "Actualizar Proyecto" : "Crear Proyecto"}
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
