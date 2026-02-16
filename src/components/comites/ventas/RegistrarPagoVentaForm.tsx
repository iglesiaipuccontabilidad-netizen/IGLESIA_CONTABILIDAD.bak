"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, X, DollarSign } from "lucide-react"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"

const pagoVentaSchema = z.object({
  monto: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "El monto debe ser mayor a cero",
  }),
  fecha_pago: z.string().optional(),
  metodo_pago: z.enum(["efectivo", "transferencia", "tarjeta", "otro"]).optional(),
  referencia: z.string().optional(),
  notas: z.string().optional(),
})

type PagoVentaFormData = z.infer<typeof pagoVentaSchema>

interface RegistrarPagoVentaFormProps {
  ventaId: string
  saldoPendiente: number
  onSuccess?: () => void
  onCancel?: () => void
}

export function RegistrarPagoVentaForm({
  ventaId,
  saldoPendiente,
  onSuccess,
  onCancel,
}: RegistrarPagoVentaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<PagoVentaFormData>({
    resolver: zodResolver(pagoVentaSchema),
    defaultValues: {
      monto: "",
      fecha_pago: new Date().toISOString().split("T")[0],
      metodo_pago: "efectivo",
      referencia: "",
      notas: "",
    },
  })

  const onSubmit = async (data: PagoVentaFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        venta_id: ventaId,
        monto: parseFloat(data.monto),
        fecha_pago: data.fecha_pago || undefined,
        metodo_pago: data.metodo_pago,
        referencia: data.referencia || undefined,
        notas: data.notas || undefined,
      }

      const { registrarPagoVenta } = await import("@/app/actions/comites-actions")
      const result = await registrarPagoVenta(payload)

      if (!result.success) {
        throw new Error(result.error || "Error al registrar pago")
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("Error al registrar pago:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Información del saldo */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-amber-900">Saldo Pendiente:</span>
          <span className="text-xl font-bold text-amber-600">
            ${saldoPendiente.toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monto */}
        <div>
          <label htmlFor="monto" className="block text-sm font-medium text-slate-700 mb-2">
            Monto del Pago <span className="text-red-500">*</span>
          </label>
          <Controller
            name="monto"
            control={control}
            render={({ field }) => (
              <FormattedNumberInput
                {...field}
                placeholder="0"
                showCurrency={true}
                showFormatted={false}
                className="w-full py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                error={errors.monto?.message}
              />
            )}
          />
          {errors.monto && <p className="mt-1 text-sm text-red-600">{errors.monto.message}</p>}
          <button
            type="button"
            onClick={() => setValue("monto", saldoPendiente.toString())}
            className="mt-2 text-xs text-green-600 hover:text-green-700 font-medium"
          >
            Pagar total pendiente
          </button>
        </div>

        {/* Fecha */}
        <div>
          <label htmlFor="fecha_pago" className="block text-sm font-medium text-slate-700 mb-2">
            Fecha del Pago
          </label>
          <input
            id="fecha_pago"
            type="date"
            {...register("fecha_pago")}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Método de Pago */}
        <div>
          <label htmlFor="metodo_pago" className="block text-sm font-medium text-slate-700 mb-2">
            Método de Pago
          </label>
          <select
            id="metodo_pago"
            {...register("metodo_pago")}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Referencia */}
        <div>
          <label htmlFor="referencia" className="block text-sm font-medium text-slate-700 mb-2">
            Referencia (Opcional)
          </label>
          <input
            id="referencia"
            type="text"
            {...register("referencia")}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Número de transacción, etc."
          />
        </div>
      </div>

      {/* Notas */}
      <div>
        <label htmlFor="notas" className="block text-sm font-medium text-slate-700 mb-2">
          Notas (Opcional)
        </label>
        <textarea
          id="notas"
          {...register("notas")}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          placeholder="Observaciones sobre el pago..."
        />
      </div>

      {/* Botones */}
      <div className="flex items-center gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4 inline mr-2" />
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4" />
              Registrar Pago
            </>
          )}
        </button>
      </div>
    </form>
  )
}
