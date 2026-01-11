"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, X, TrendingDown, AlertTriangle } from "lucide-react"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"

const gastoSchema = z.object({
  monto: z.number().min(1, "El monto debe ser mayor a 0"),
  fecha: z.string().min(1, "La fecha es requerida"),
  concepto: z.string().min(3, "El concepto debe tener al menos 3 caracteres"),
  metodo_pago: z.enum(["efectivo", "transferencia", "cheque", "otro"]),
  comprobante: z.string().optional(),
  nota: z.string().optional(),
})

type GastoFormData = z.infer<typeof gastoSchema>

interface ComiteGastoFormProps {
  comiteId: string
  initialData?: Partial<GastoFormData>
  gastoId?: string
  balanceDisponible?: number
  onSuccess?: () => void
  onCancel?: () => void
}

export function ComiteGastoForm({
  comiteId,
  initialData,
  gastoId,
  balanceDisponible,
  onSuccess,
  onCancel,
}: ComiteGastoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GastoFormData>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      monto: initialData?.monto ? Number(initialData.monto) : undefined,
      fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
      concepto: initialData?.concepto || "",
      metodo_pago: (initialData?.metodo_pago || "efectivo") as any,
      comprobante: initialData?.comprobante || "",
      nota: initialData?.nota || "",
    },
  })

  const onSubmit = async (data: GastoFormData) => {
    setIsSubmitting(true)
    setError(null)
    setWarning(null)

    try {
      const montoGasto = data.monto
      
      // Advertir si el gasto supera el balance disponible (pero permitirlo)
      if (!gastoId && balanceDisponible !== undefined && montoGasto > balanceDisponible) {
        setWarning(
          `⚠️ Advertencia: El gasto ($${montoGasto.toLocaleString('es-CO')}) supera el balance disponible ($${balanceDisponible.toLocaleString('es-CO')}). El comité quedará en déficit.`
        )
        // Permitir que continúe pero mostrar advertencia
      }
      
      // Preparar datos
      const payload = {
        comite_id: comiteId,
        monto: montoGasto,
        fecha: data.fecha,
        concepto: data.concepto,
        metodo_pago: data.metodo_pago,
        comprobante: data.comprobante || undefined,
        nota: data.nota || undefined,
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
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200 text-sm flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {warning && (
        <div className="bg-amber-50 text-amber-700 p-4 rounded-lg border border-amber-200 text-sm flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}
      
      {/* Balance disponible */}
      {balanceDisponible !== undefined && !gastoId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-900 font-medium">Balance disponible:</span>
            <span className="text-lg font-bold text-blue-900">
              ${balanceDisponible.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
            </span>
          </div>
          {balanceDisponible < 100000 && (
            <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Balance bajo. Considere este límite al registrar gastos.
            </p>
          )}
        </div>
      )}

      {/* Monto */}
      <div>
        <label htmlFor="monto" className="block text-sm font-medium text-slate-700 mb-2">
          Monto <span className="text-rose-500">*</span>
        </label>
        <input
          id="monto"
          type="number"
          step="1"
          {...register("monto", {
            valueAsNumber: true,
          })}
          className={`
            w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500
            ${errors.monto ? "border-rose-300" : "border-slate-300"}
          `}
          placeholder="0"
          disabled={isSubmitting}
        />
        {errors.monto && (
          <p className="text-xs text-rose-600 mt-1">{errors.monto.message}</p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label htmlFor="fecha" className="block text-sm font-medium text-slate-700 mb-2">
          Fecha <span className="text-rose-500">*</span>
        </label>
        <input
          {...register("fecha")}
          type="date"
          id="fecha"
          className={`
            w-full px-4 py-2.5 rounded-lg border bg-white
            focus:outline-none focus:ring-2 focus:ring-rose-500
            ${errors.fecha ? "border-rose-300" : "border-slate-200"}
          `}
          disabled={isSubmitting}
        />
        {errors.fecha && (
          <p className="text-rose-500 text-xs mt-1">{errors.fecha.message}</p>
        )}
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
          <option value="cheque">Cheque</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {/* Comprobante */}
      <div>
        <label htmlFor="comprobante" className="block text-sm font-medium text-slate-700 mb-2">
          Comprobante <span className="text-slate-400">(opcional)</span>
        </label>
        <input
          {...register("comprobante")}
          type="text"
          id="comprobante"
          placeholder="Número de factura o recibo"
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          disabled={isSubmitting}
        />
      </div>

      {/* Nota */}
      <div>
        <label htmlFor="nota" className="block text-sm font-medium text-slate-700 mb-2">
          Nota <span className="text-slate-400">(opcional)</span>
        </label>
        <textarea
          {...register("nota")}
          id="nota"
          rows={2}
          placeholder="Observaciones adicionales..."
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
