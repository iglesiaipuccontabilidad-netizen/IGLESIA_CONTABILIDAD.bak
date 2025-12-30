"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, X, Vote } from "lucide-react"

const votoSchema = z.object({
  comite_miembro_id: z.string().min(1, "Debes seleccionar un miembro"),
  proyecto_id: z.string().optional(),
  monto_total: z.string().min(1, "El monto es requerido"),
  fecha_limite: z.string().min(1, "La fecha límite es requerida"),
  concepto: z.string().optional(),
  estado: z.enum(["activo", "completado", "cancelado"]).default("activo"),
})

type VotoFormData = z.infer<typeof votoSchema>

interface ComiteVotoFormProps {
  comiteId: string
  initialData?: Partial<VotoFormData & { recaudado?: number }>
  votoId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ComiteVotoForm({
  comiteId,
  initialData,
  votoId,
  onSuccess,
  onCancel,
}: ComiteVotoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [miembros, setMiembros] = useState<any[]>([])
  const [proyectos, setProyectos] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(votoSchema),
    defaultValues: {
      comite_miembro_id: initialData?.comite_miembro_id || "",
      proyecto_id: initialData?.proyecto_id || "",
      monto_total: initialData?.monto_total || "",
      fecha_limite: initialData?.fecha_limite || "",
      concepto: initialData?.concepto || "",
      estado: (initialData?.estado || "activo") as any,
    },
  })

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar miembros del comité
        const resMiembros = await fetch(`/api/comites/${comiteId}/miembros`)
        if (resMiembros.ok) {
          const dataMiembros = await resMiembros.json()
          setMiembros(dataMiembros.miembros || [])
        }

        // Cargar proyectos activos del comité
        const resProyectos = await fetch(`/api/comites/${comiteId}/proyectos?estado=activo`)
        if (resProyectos.ok) {
          const dataProyectos = await resProyectos.json()
          setProyectos(dataProyectos.proyectos || [])
        }
      } catch (err) {
        console.error("Error al cargar datos:", err)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [comiteId])

  const handleSubmit2 = async (data: VotoFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Preparar datos
      const payload = {
        comite_id: comiteId,
        comite_miembro_id: data.comite_miembro_id,
        proyecto_id: data.proyecto_id || undefined,
        monto_total: parseFloat(data.monto_total),
        fecha_limite: data.fecha_limite,
        concepto: data.concepto || undefined,
        estado: data.estado,
      }

      // Llamar a la action del servidor
      const { createComiteVoto, updateComiteVoto } = await import(
        "@/app/actions/comites-actions"
      )

      const result = votoId
        ? await updateComiteVoto(votoId, payload as any)
        : await createComiteVoto(payload as any)

      if (!result.success) {
        throw new Error(result.error || "Error al guardar voto")
      }

      // Éxito
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/dashboard/comites/${comiteId}/votos`)
        router.refresh()
      }
    } catch (err: any) {
      console.error("Error al guardar voto:", err)
      setError(err.message || "Error al guardar voto")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(handleSubmit2)} className="space-y-5">
      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Miembro */}
      <div>
        <label htmlFor="comite_miembro_id" className="block text-sm font-medium text-slate-700 mb-2">
          Miembro <span className="text-rose-500">*</span>
        </label>
        <select
          id="comite_miembro_id"
          {...register("comite_miembro_id")}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Selecciona un miembro</option>
          {miembros.map((miembro) => (
            <option key={miembro.id} value={miembro.id}>
              {miembro.nombres} {miembro.apellidos}
            </option>
          ))}
        </select>
        {errors.comite_miembro_id && (
          <p className="text-rose-500 text-xs mt-1">{errors.comite_miembro_id.message}</p>
        )}
      </div>

      {/* Proyecto */}
      <div>
        <label htmlFor="proyecto_id" className="block text-sm font-medium text-slate-700 mb-2">
          Proyecto
        </label>
        <select
          id="proyecto_id"
          {...register("proyecto_id")}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Sin proyecto asociado</option>
          {proyectos.map((proyecto) => (
            <option key={proyecto.id} value={proyecto.id}>
              {proyecto.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Monto Total */}
      <div>
        <label htmlFor="monto_total" className="block text-sm font-medium text-slate-700 mb-2">
          Monto Total <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          id="monto_total"
          step="0.01"
          {...register("monto_total")}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
        />
        {errors.monto_total && (
          <p className="text-rose-500 text-xs mt-1">{errors.monto_total.message}</p>
        )}
      </div>

      {/* Fecha Límite */}
      <div>
        <label htmlFor="fecha_limite" className="block text-sm font-medium text-slate-700 mb-2">
          Fecha Límite <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          id="fecha_limite"
          {...register("fecha_limite")}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {errors.fecha_limite && (
          <p className="text-rose-500 text-xs mt-1">{errors.fecha_limite.message}</p>
        )}
      </div>

      {/* Concepto */}
      <div>
        <label htmlFor="concepto" className="block text-sm font-medium text-slate-700 mb-2">
          Concepto
        </label>
        <textarea
          id="concepto"
          {...register("concepto")}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Descripción del voto"
        />
      </div>

      {/* Estado */}
      <div>
        <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-2">
          Estado
        </label>
        <select
          id="estado"
          {...register("estado")}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="activo">Activo</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <X className="w-4 h-4 inline mr-2" />
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar
            </>
          )}
        </button>
      </div>
    </form>
  )
}
