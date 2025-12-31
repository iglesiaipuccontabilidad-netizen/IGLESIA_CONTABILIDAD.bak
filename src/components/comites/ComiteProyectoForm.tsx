"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, X, Target, FileText, DollarSign, Calendar as CalendarIcon, Activity } from "lucide-react"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border-2 border-rose-200 text-sm font-medium flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <X className="w-3 h-3 text-rose-700" />
          </div>
          <span>{error}</span>
        </div>
      )}

      {/* Nombre */}
      <div>
        <label htmlFor="nombre" className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
            <Target className="w-3 h-3 text-purple-600" />
          </div>
          Nombre del Proyecto <span className="text-rose-500">*</span>
        </label>
        <input
          {...register("nombre")}
          type="text"
          id="nombre"
          placeholder="Ej: Retiro Jóvenes 2025, Campamento de Verano..."
          className={`
            w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-900 font-medium
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
            placeholder:text-slate-400 placeholder:font-normal
            transition-all
            ${errors.nombre ? "border-rose-300 bg-rose-50" : "border-slate-200 hover:border-slate-300"}
          `}
          disabled={isSubmitting}
        />
        {errors.nombre && (
          <p className="text-rose-600 text-xs mt-2 font-semibold flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-rose-600" />
            {errors.nombre.message}
          </p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="descripcion" className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
            <FileText className="w-3 h-3 text-slate-600" />
          </div>
          Descripción <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <textarea
          {...register("descripcion")}
          id="descripcion"
          rows={4}
          placeholder="Describe los objetivos y actividades del proyecto..."
          className={`
            w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-900
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
            placeholder:text-slate-400 resize-none
            transition-all
            ${errors.descripcion ? "border-rose-300 bg-rose-50" : "border-slate-200 hover:border-slate-300"}
          `}
          disabled={isSubmitting}
        />
        {errors.descripcion && (
          <p className="text-rose-600 text-xs mt-2 font-semibold flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-rose-600" />
            {errors.descripcion.message}
          </p>
        )}
      </div>

      {/* Monto Objetivo */}
      <div>
        <label htmlFor="monto_objetivo" className="block text-sm font-medium text-slate-700 mb-2">
          Monto Objetivo (opcional)
        </label>
        <input
          id="monto_objetivo"
          type="number"
          {...register("monto_objetivo", {
            valueAsNumber: true,
            min: { value: 0, message: "El monto no puede ser negativo" },
          })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0"
          disabled={isSubmitting}
        />
        {errors.monto_objetivo && (
          <p className="text-xs text-rose-600 mt-1">{errors.monto_objetivo.message}</p>
        )}
        {!errors.monto_objetivo && (
          <p className="text-xs text-slate-500 mt-1">Monto que se espera recaudar para este proyecto</p>
        )}
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="fecha_inicio" className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
              <CalendarIcon className="w-3 h-3 text-blue-600" />
            </div>
            Fecha de Inicio <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input
            {...register("fecha_inicio")}
            type="date"
            id="fecha_inicio"
            className={`
              w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-900 font-medium
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
              transition-all
              ${errors.fecha_inicio ? "border-rose-300 bg-rose-50" : "border-slate-200 hover:border-slate-300"}
            `}
            disabled={isSubmitting}
          />
          {errors.fecha_inicio && (
            <p className="text-rose-600 text-xs mt-2 font-semibold flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-rose-600" />
              {errors.fecha_inicio.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="fecha_fin" className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center">
              <CalendarIcon className="w-3 h-3 text-amber-600" />
            </div>
            Fecha de Fin <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input
            {...register("fecha_fin")}
            type="date"
            id="fecha_fin"
            className={`
              w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-900 font-medium
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
              transition-all
              ${errors.fecha_fin ? "border-rose-300 bg-rose-50" : "border-slate-200 hover:border-slate-300"}
            `}
            disabled={isSubmitting}
          />
          {errors.fecha_fin && (
            <p className="text-rose-600 text-xs mt-2 font-semibold flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-rose-600" />
              {errors.fecha_fin.message}
            </p>
          )}
        </div>
      </div>

      {/* Estado */}
      <div>
        <label htmlFor="estado" className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
            <Activity className="w-3 h-3 text-purple-600" />
          </div>
          Estado
        </label>
        <select
          {...register("estado")}
          id="estado"
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          disabled={isSubmitting}
        >
          <option value="activo">✅ Activo</option>
          <option value="completado">✔️ Completado</option>
          <option value="cancelado">❌ Cancelado</option>
        </select>
      </div>

      {/* Monto Recaudado (solo mostrar si existe) */}
      {initialData?.monto_recaudado !== undefined && (
        <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs text-purple-900 font-bold uppercase tracking-wider mb-1">Monto Recaudado</p>
              <p className="text-3xl font-black text-purple-600">
                ${initialData.monto_recaudado.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <p className="text-xs text-purple-700 mt-3 font-medium flex items-start gap-2">
            <span className="text-base">ℹ️</span>
            Este monto se actualiza automáticamente con los pagos de votos asociados
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-6 border-t-2 border-slate-100">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-3.5 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-purple-500/30"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {proyectoId ? "Actualizar Proyecto" : "Crear Proyecto"}
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
