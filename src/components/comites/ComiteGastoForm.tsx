"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, X, TrendingDown } from "lucide-react"

const gastoSchema = z.object({
  monto: z.string().min(1, "El monto es requerido"),
  fecha_gasto: z.string().min(1, "La fecha es requerida"),
  categoria: z.enum(["operativo", "infraestructura", "social", "otro"]),
  concepto: z.string().min(3, "El concepto debe tener al menos 3 caracteres"),
  beneficiario: z.string().optional(),
  metodo_pago: z.enum(["efectivo", "transferencia", "otro"]),
  numero_comprobante: z.string().optional(),
})

type GastoFormData = z.infer<typeof gastoSchema>

interface ComiteGastoFormProps {
  comiteId: string
  initialData?: Partial<GastoFormData>
  gastoId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ComiteGastoForm({
  comiteId,
  initialData,
  gastoId,
  onSuccess,
  onCancel,
}: ComiteGastoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    // resolver: zodResolver(gastoSchema),
    defaultValues: {
      monto: initialData?.monto || "",
      fecha_gasto: initialData?.fecha_gasto || new Date().toISOString().split('T')[0],
      categoria: (initialData?.categoria || "operativo") as any,
      concepto: initialData?.concepto || "",
      beneficiario: initialData?.beneficiario || "",
      metodo_pago: (initialData?.metodo_pago || "efectivo") as any,
      numero_comprobante: initialData?.numero_comprobante || "",
    },
  })

  const onSubmit = async (data: GastoFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Preparar datos
      const payload = {
        comite_id: comiteId,
        monto: parseFloat(data.monto),
        fecha_gasto: data.fecha_gasto,
        categoria: data.categoria,
        concepto: data.concepto,
        beneficiario: data.beneficiario || undefined,
        metodo_pago: data.metodo_pago,
        numero_comprobante: data.numero_comprobante || undefined,
      }

      // Llamar a la action del servidor
      const { registrarComiteGasto, updateComiteGasto } = await import("@/app/actions/comites-actions")
      
      const result = gastoId
        ? await updateComiteGasto(gastoId, payload)
        : await registrarComiteGasto(payload)

      if (!result.success) {
        throw new Error(result.error || "Error al guardar gasto")
      }

      // Éxito
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/dashboard/comites/${comiteId}/gastos`)
        router.refresh()
      }
    } catch (err: any) {
      console.error("Error al guardar gasto:", err)
      setError(err.message || "Error al guardar gasto")
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
          Monto <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <input
            {...register("monto")}
            type="number"
            id="monto"
            step="0.01"
            placeholder="0"
            className={`
              w-full pl-8 pr-4 py-2.5 rounded-lg border bg-white
              focus:outline-none focus:ring-2 focus:ring-rose-500
              ${errors.monto ? "border-rose-300" : "border-slate-200"}
            `}
            disabled={isSubmitting}
          />
        </div>
        {errors.monto && (
          <p className="text-rose-500 text-xs mt-1">{errors.monto.message}</p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label htmlFor="fecha_gasto" className="block text-sm font-medium text-slate-700 mb-2">
          Fecha <span className="text-rose-500">*</span>
        </label>
        <input
          {...register("fecha_gasto")}
          type="date"
          id="fecha_gasto"
          className={`
            w-full px-4 py-2.5 rounded-lg border bg-white
            focus:outline-none focus:ring-2 focus:ring-rose-500
            ${errors.fecha_gasto ? "border-rose-300" : "border-slate-200"}
          `}
          disabled={isSubmitting}
        />
        {errors.fecha_gasto && (
          <p className="text-rose-500 text-xs mt-1">{errors.fecha_gasto.message}</p>
        )}
      </div>

      {/* Categoría */}
      <div>
        <label htmlFor="categoria" className="block text-sm font-medium text-slate-700 mb-2">
          Categoría
        </label>
        <select
          {...register("categoria")}
          id="categoria"
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          disabled={isSubmitting}
        >
          <option value="operativo">Operativo</option>
          <option value="infraestructura">Infraestructura</option>
          <option value="social">Social</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {/* Concepto */}
      <div>
        <label htmlFor="concepto" className="block text-sm font-medium text-slate-700 mb-2">
          Concepto <span className="text-rose-500">*</span>
        </label>
        <textarea
          {...register("concepto")}
          id="concepto"
          rows={3}
          placeholder="Describe el concepto del gasto..."
          className={`
            w-full px-4 py-2.5 rounded-lg border bg-white
            focus:outline-none focus:ring-2 focus:ring-rose-500
            ${errors.concepto ? "border-rose-300" : "border-slate-200"}
          `}
          disabled={isSubmitting}
        />
        {errors.concepto && (
          <p className="text-rose-500 text-xs mt-1">{errors.concepto.message}</p>
        )}
      </div>

      {/* Beneficiario */}
      <div>
        <label htmlFor="beneficiario" className="block text-sm font-medium text-slate-700 mb-2">
          Beneficiario <span className="text-slate-400">(opcional)</span>
        </label>
        <input
          {...register("beneficiario")}
          type="text"
          id="beneficiario"
          placeholder="Nombre del beneficiario o proveedor..."
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
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
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
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
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          disabled={isSubmitting}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {gastoId ? "Actualizar Gasto" : "Registrar Gasto"}
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
