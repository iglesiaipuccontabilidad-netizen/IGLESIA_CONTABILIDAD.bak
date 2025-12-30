"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, X } from "lucide-react"

const comiteSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  descripcion: z.string(),
  estado: z.enum(["activo", "inactivo"]),
})

type ComiteFormData = z.infer<typeof comiteSchema>

interface ComiteFormProps {
  initialData?: Partial<ComiteFormData>
  comiteId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ComiteForm({ initialData, comiteId, onSuccess, onCancel }: ComiteFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    // resolver: zodResolver(comiteSchema),
    defaultValues: {
      nombre: initialData?.nombre || "",
      descripcion: initialData?.descripcion || "",
      estado: (initialData?.estado || "activo") as "activo" | "inactivo",
    },
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const url = comiteId
        ? `/api/comites/${comiteId}`
        : "/api/comites"

      const method = comiteId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar el comité")
      }

      // Éxito
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/comites")
        router.refresh()
      }
    } catch (err: any) {
      console.error("Error al guardar comité:", err)
      setError(err.message || "Error al guardar el comité")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          {error}
        </div>
      )}

      {/* Nombre */}
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-2">
          Nombre del Comité <span className="text-rose-500">*</span>
        </label>
        <input
          {...register("nombre")}
          type="text"
          id="nombre"
          placeholder="Ej: DECOM, Jóvenes, Damas..."
          className={`
            w-full px-4 py-3 rounded-lg border bg-white
            focus:outline-none focus:ring-2 focus:ring-primary-500
            ${errors.nombre ? "border-rose-300" : "border-slate-200"}
          `}
          disabled={isSubmitting}
        />
        {errors.nombre && (
          <p className="text-rose-500 text-sm mt-1">{errors.nombre.message}</p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-2">
          Descripción
        </label>
        <textarea
          {...register("descripcion")}
          id="descripcion"
          rows={4}
          placeholder="Describe el propósito y actividades del comité..."
          className={`
            w-full px-4 py-3 rounded-lg border bg-white
            focus:outline-none focus:ring-2 focus:ring-primary-500
            ${errors.descripcion ? "border-rose-300" : "border-slate-200"}
          `}
          disabled={isSubmitting}
        />
        {errors.descripcion && (
          <p className="text-rose-500 text-sm mt-1">{errors.descripcion.message}</p>
        )}
      </div>

      {/* Estado */}
      <div>
        <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-2">
          Estado
        </label>
        <select
          {...register("estado")}
          id="estado"
          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={isSubmitting}
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        {errors.estado && (
          <p className="text-rose-500 text-sm mt-1">{errors.estado.message}</p>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 via-primary-600 to-cyan-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {comiteId ? "Actualizar Comité" : "Crear Comité"}
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 inline mr-2" />
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
