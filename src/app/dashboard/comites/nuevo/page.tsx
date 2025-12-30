"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createComite } from "@/app/actions/comites-actions"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

const comiteSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  descripcion: z.string(),
  estado: z.enum(["activo", "inactivo"]),
})

type ComiteFormData = z.infer<typeof comiteSchema>

export default function NuevoComitePage() {
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
      nombre: "",
      descripcion: "",
      estado: "activo" as const,
    },
  })

  const onSubmit = async (data: ComiteFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createComite(data)

      if (!result.success) {
        throw new Error(result.error || "Error al crear el comité")
      }

      // Éxito - redirigir a la lista de comités
      router.push("/dashboard/comites")
      router.refresh()
    } catch (err: any) {
      console.error("Error al crear comité:", err)
      setError(err.message || "Error al crear el comité")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/comites"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Comités
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-900">
          Crear Nuevo Comité
        </h1>
        <p className="text-slate-600 mt-2">
          Configura un nuevo comité con contabilidad independiente
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-slate-200 p-8">
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
              placeholder="Ej: DECOM, Jóvenes, Damas, Caballeros..."
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
              Descripción <span className="text-slate-400">(opcional)</span>
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
            <p className="text-xs text-slate-500 mt-2">
              Esta información ayudará a los miembros a entender el objetivo del comité
            </p>
          </div>

          {/* Estado */}
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-2">
              Estado Inicial
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
            <p className="text-xs text-slate-500 mt-2">
              Los comités inactivos no aparecerán en el dashboard principal
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 via-primary-600 to-cyan-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando Comité...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Crear Comité
                </>
              )}
            </button>

            <Link
              href="/dashboard/comites"
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors inline-flex items-center justify-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {/* Ayuda */}
      <div className="mt-6 bg-primary-50 rounded-lg border border-primary-100 p-6">
        <h3 className="font-semibold text-primary-900 mb-2">💡 Siguiente paso</h3>
        <p className="text-sm text-primary-700">
          Después de crear el comité, podrás asignar usuarios (Líder, Tesorero, Secretario) y 
          agregar miembros para comenzar a gestionar su contabilidad de forma independiente.
        </p>
      </div>
    </div>
  )
}
