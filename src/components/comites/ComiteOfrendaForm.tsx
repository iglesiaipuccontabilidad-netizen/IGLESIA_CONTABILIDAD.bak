"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, X, TrendingUp } from "lucide-react"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"

const ofrendaSchema = z.object({
  monto: z.string().min(1, "El monto es requerido").refine((val) => {
    const num = parseFloat(val.replace(/[^\d]/g, ''))
    return num > 0 && num <= 10000000 // Máximo 10 millones
  }, "El monto debe ser mayor a 0 y menor a 10.000.000"),
  fecha_ofrenda: z.string().min(1, "La fecha es requerida").refine((val) => {
    const fecha = new Date(val)
    const hoy = new Date()
    const haceUnAnio = new Date()
    haceUnAnio.setFullYear(hoy.getFullYear() - 1)
    return fecha >= haceUnAnio && fecha <= hoy
  }, "La fecha debe estar dentro del último año"),
  tipo_ofrenda: z.enum(["diezmo", "ofrenda", "primicia", "otro"]).default("ofrenda"),
  concepto: z.string().min(3, "El concepto debe tener al menos 3 caracteres").max(200, "El concepto no puede exceder 200 caracteres"),
  metodo_pago: z.enum(["efectivo", "transferencia", "datafono", "otro"]).default("efectivo"),
  numero_comprobante: z.string().optional().refine((val) => {
    if (!val) return true
    return val.length >= 3 && val.length <= 50
  }, "El número de comprobante debe tener entre 3 y 50 caracteres"),
  proyecto_id: z.string().optional(),
})

type OfrendaFormData = z.infer<typeof ofrendaSchema>

interface ComiteOfrendaFormProps {
  comiteId: string
  initialData?: Partial<OfrendaFormData>
  ofrendaId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ComiteOfrendaForm({
  comiteId,
  initialData,
  ofrendaId,
  onSuccess,
  onCancel,
}: ComiteOfrendaFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proyectos, setProyectos] = useState<any[]>([])

  // Cargar proyectos del comité
  useEffect(() => {
    const cargarProyectos = async () => {
      try {
        const { getProyectosComite } = await import("@/app/actions/comites-actions")
        const result = await getProyectosComite(comiteId)
        if (result.success && result.data) {
          setProyectos(result.data.filter((p: any) => p.estado === 'activo'))
        }
      } catch (error) {
        console.error('Error al cargar proyectos:', error)
      }
    }
    cargarProyectos()
  }, [comiteId])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OfrendaFormData>({
    // // resolver: zodResolver(ofrendaSchema), // Temporalmente deshabilitado
    defaultValues: initialData || {
      monto: "",
      fecha_ofrenda: new Date().toISOString().split('T')[0],
      tipo_ofrenda: "ofrenda",
      concepto: "",
      metodo_pago: "efectivo",
      numero_comprobante: "",      proyecto_id: "",    },
  })

  const onSubmit = async (data: OfrendaFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      console.log('🔍 ComiteOfrendaForm - Preparando ofrenda:', {
        comiteId,
        ofrendaId,
        formData: data
      })
      
      // Preparar datos - mapear a RegistrarOfrendaDTO
      const payload = {
        comite_id: comiteId,
        monto: parseFloat(data.monto),
        fecha: data.fecha_ofrenda,
        tipo: data.tipo_ofrenda,
        concepto: data.concepto || "Ofrenda general",
        nota: data.numero_comprobante ? `Comprobante: ${data.numero_comprobante}` : undefined,
        proyecto_id: data.proyecto_id || undefined,
      }

      console.log('📤 Enviando payload:', payload)

      // Llamar a la action del servidor
      const { registrarComiteOfrenda, updateComiteOfrenda } = await import("@/app/actions/comites-actions")
      
      const result = ofrendaId
        ? await updateComiteOfrenda(ofrendaId, payload as any)
        : await registrarComiteOfrenda(payload as any)

      console.log('📥 Resultado de la action:', result)

      if (!result.success) {
        throw new Error(result.error || "Error al guardar ofrenda")
      }

      // Éxito
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/dashboard/comites/${comiteId}/ofrendas`)
        router.refresh()
      }
    } catch (err: any) {
      console.error("Error al guardar ofrenda:", err)
      setError(err.message || "Error al guardar ofrenda")
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

      {/* Monto */}
      <div>
        <label htmlFor="monto" className="block text-sm font-medium text-slate-700 mb-2">
          Monto <span className="text-emerald-500">*</span>
        </label>
        <input
          id="monto"
          type="number"
          {...register("monto", {
            required: "El monto es requerido",
            valueAsNumber: true,
            min: { value: 1, message: "El monto debe ser mayor a 0" },
          })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="0"
          disabled={isSubmitting}
        />
        {errors.monto && (
          <p className="text-xs text-rose-600 mt-1">{errors.monto.message}</p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label htmlFor="fecha_ofrenda" className="block text-sm font-medium text-slate-700 mb-2">
          Fecha <span className="text-rose-500">*</span>
        </label>
        <input
          {...register("fecha_ofrenda")}
          type="date"
          id="fecha_ofrenda"
          className={`
            w-full px-4 py-2.5 rounded-lg border bg-white
            focus:outline-none focus:ring-2 focus:ring-emerald-500
            ${errors.fecha_ofrenda ? "border-rose-300" : "border-slate-200"}
          `}
          disabled={isSubmitting}
        />
        {errors.fecha_ofrenda && (
          <p className="text-rose-500 text-xs mt-1">{errors.fecha_ofrenda.message}</p>
        )}
      </div>

      {/* Tipo de Ofrenda */}
      <div>
        <label htmlFor="tipo_ofrenda" className="block text-sm font-medium text-slate-700 mb-2">
          Tipo de Ofrenda
        </label>
        <select
          {...register("tipo_ofrenda")}
          id="tipo_ofrenda"
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={isSubmitting}
        >
          <option value="ofrenda">Ofrenda</option>
          <option value="diezmo">Diezmo</option>
          <option value="primicia">Primicia</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {/* Proyecto (opcional) */}
      <div>
        <label htmlFor="proyecto_id" className="block text-sm font-medium text-slate-700 mb-2">
          Proyecto <span className="text-slate-400">(opcional)</span>
        </label>
        <select
          {...register("proyecto_id")}
          id="proyecto_id"
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={isSubmitting}
        >
          <option value="">Sin proyecto específico</option>
          {proyectos.map((proyecto) => (
            <option key={proyecto.id} value={proyecto.id}>
              {proyecto.nombre} {proyecto.monto_objetivo ? `(${proyecto.monto_objetivo.toLocaleString('es-CO')})` : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          Asocia esta ofrenda a un proyecto específico del comité
        </p>
      </div>

      {/* Concepto */}
      <div>
        <label htmlFor="concepto" className="block text-sm font-medium text-slate-700 mb-2">
          Concepto <span className="text-slate-400">(opcional)</span>
        </label>
        <textarea
          {...register("concepto")}
          id="concepto"
          rows={3}
          placeholder="Describe el concepto de la ofrenda..."
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={isSubmitting}
        />
      </div>

      {/* Método de Pago */}
      <div>
        <label htmlFor="metodo_pago" className="block text-sm font-medium text-slate-700 mb-2">
          Método de Pago
        </label>
        <select
          {...register("metodo_pago")}
          id="metodo_pago"
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={isSubmitting}
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="datafono">Datáfono</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {/* Número de Comprobante */}
      <div>
        <label htmlFor="numero_comprobante" className="block text-sm font-medium text-slate-700 mb-2">
          Número de Comprobante <span className="text-slate-400">(opcional)</span>
        </label>
        <input
          {...register("numero_comprobante")}
          type="text"
          id="numero_comprobante"
          placeholder="Ej: 123456789"
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          disabled={isSubmitting}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {ofrendaId ? "Actualizar Ofrenda" : "Registrar Ofrenda"}
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
