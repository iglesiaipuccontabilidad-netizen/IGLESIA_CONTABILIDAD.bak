"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { X, DollarSign, Loader2, Check, Calendar } from "lucide-react"

const pagoSchema = z.object({
  monto: z.string().min(1, "El monto es requerido"),
  fecha_pago: z.string().min(1, "La fecha de pago es requerida"),
  metodo_pago: z.enum(["efectivo", "transferencia", "otro"]).default("efectivo"),
  numero_comprobante: z.string().optional(),
  observaciones: z.string().optional(),
})

type PagoFormData = z.infer<typeof pagoSchema>

interface RegistrarPagoModalProps {
  votoId: string
  comiteId: string
  montoTotal: number
  montoPagado: number
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function RegistrarPagoModal({
  votoId,
  comiteId,
  montoTotal,
  montoPagado,
  isOpen,
  onClose,
  onSuccess,
}: RegistrarPagoModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const montoRestante = montoTotal - montoPagado

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      monto: montoRestante.toString(),
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: "efectivo",
      numero_comprobante: "",
      observaciones: "",
    },
  })

  const onSubmit = async (data: PagoFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const monto = parseFloat(data.monto)

      // Validar que el monto no exceda el restante
      if (monto > montoRestante) {
        throw new Error(`El monto no puede exceder ${montoRestante.toLocaleString('es-CO')}`)
      }

      if (monto <= 0) {
        throw new Error("El monto debe ser mayor a 0")
      }

      // Preparar datos
      const payload = {
        comite_voto_id: votoId,
        monto,
        fecha_pago: data.fecha_pago,
        metodo_pago: data.metodo_pago,
        nota: data.observaciones || undefined,
      }

      // Llamar a la action del servidor
      const { registrarPagoComite } = await import("@/app/actions/comites-actions")
      const result = await registrarPagoComite(payload)

      if (!result.success) {
        throw new Error(result.error || "Error al registrar pago")
      }

      // Éxito
      reset()
      router.refresh()
      
      if (onSuccess) {
        onSuccess()
      }
      
      onClose()
    } catch (err: any) {
      console.error("Error al registrar pago:", err)
      setError(err.message || "Error al registrar pago")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              Registrar Pago
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Registra un abono o pago completo del voto
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Información del voto */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Monto Total:</span>
            <span className="text-lg font-bold text-slate-900">
              ${montoTotal.toLocaleString('es-CO')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Pagado:</span>
            <span className="text-lg font-bold text-emerald-600">
              ${montoPagado.toLocaleString('es-CO')}
            </span>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-900">Restante:</span>
            <span className="text-xl font-bold text-cyan-600">
              ${montoRestante.toLocaleString('es-CO')}
            </span>
          </div>
          
          {/* Barra de progreso */}
          <div className="pt-2">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min((montoPagado / montoTotal) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 text-center">
              {((montoPagado / montoTotal) * 100).toFixed(0)}% pagado
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200 text-sm">
              {error}
            </div>
          )}

          {/* Monto */}
          <div>
            <label htmlFor="monto" className="block text-sm font-medium text-slate-700 mb-2">
              Monto a Pagar <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                {...register("monto")}
                type="number"
                id="monto"
                step="0.01"
                max={montoRestante}
                placeholder="0"
                className={`
                  w-full pl-8 pr-4 py-2.5 rounded-lg border bg-white
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  ${errors.monto ? "border-rose-300" : "border-slate-200"}
                `}
                disabled={isSubmitting}
              />
            </div>
            {errors.monto && (
              <p className="text-rose-500 text-xs mt-1">{errors.monto.message}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Máximo: ${montoRestante.toLocaleString('es-CO')}
            </p>
          </div>

          {/* Fecha de Pago */}
          <div>
            <label htmlFor="fecha_pago" className="block text-sm font-medium text-slate-700 mb-2">
              Fecha de Pago <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                {...register("fecha_pago")}
                type="date"
                id="fecha_pago"
                className={`
                  w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  ${errors.fecha_pago ? "border-rose-300" : "border-slate-200"}
                `}
                disabled={isSubmitting}
              />
            </div>
            {errors.fecha_pago && (
              <p className="text-rose-500 text-xs mt-1">{errors.fecha_pago.message}</p>
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

          {/* Observaciones */}
          <div>
            <label htmlFor="observaciones" className="block text-sm font-medium text-slate-700 mb-2">
              Observaciones <span className="text-slate-400">(opcional)</span>
            </label>
            <textarea
              {...register("observaciones")}
              id="observaciones"
              rows={3}
              placeholder="Notas adicionales sobre el pago..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Registrar Pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
