"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, X, ShoppingCart } from "lucide-react"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"

const ventaSchema = z.object({
  producto_id: z.string().min(1, "Selecciona un producto"),
  comprador_nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  comprador_telefono: z.string().optional(),
  comprador_email: z.string().email("Email inválido").optional().or(z.literal("")),
  comprador_notas: z.string().optional(),
  cantidad: z.number().min(1, "La cantidad debe ser mayor a cero"),
  precio_unitario: z.number().min(0.01, "El precio debe ser mayor a cero"),
  fecha_venta: z.string().optional(),
  estado_pago: z.enum(["pendiente", "pagado"]),
  metodo_pago: z.enum(["efectivo", "transferencia", "tarjeta", "otro"]).optional(),
}).refine(
  (data) => {
    // Si el estado es 'pagado', el método de pago es requerido
    if (data.estado_pago === "pagado" && !data.metodo_pago) {
      return false
    }
    return true
  },
  {
    message: "El método de pago es requerido cuando se marca como pagado",
    path: ["metodo_pago"],
  }
)

type VentaFormData = z.infer<typeof ventaSchema>

interface Producto {
  id: string
  nombre: string
  precio_unitario: number
  estado: string
}

interface ProyectoVentaFormProps {
  proyectoId: string
  comiteId: string
  productos: Producto[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProyectoVentaForm({
  proyectoId,
  comiteId,
  productos,
  onSuccess,
  onCancel,
}: ProyectoVentaFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VentaFormData>({
    resolver: zodResolver(ventaSchema),
    defaultValues: {
      producto_id: "",
      comprador_nombre: "",
      comprador_telefono: "",
      comprador_email: "",
      comprador_notas: "",
      cantidad: 1,
      precio_unitario: 0,
      fecha_venta: new Date().toISOString().split("T")[0],
      estado_pago: "pendiente",
      metodo_pago: "efectivo",
    },
  })

  const productoId = watch("producto_id")
  const cantidad = watch("cantidad")
  const precioUnitario = watch("precio_unitario")
  const estadoPago = watch("estado_pago")

  // Actualizar precio cuando se selecciona un producto
  useEffect(() => {
    if (productoId) {
      const producto = productos.find((p) => p.id === productoId)
      if (producto) {
        setProductoSeleccionado(producto)
        setValue("precio_unitario", producto.precio_unitario, { shouldValidate: true })
      }
    }
  }, [productoId, productos, setValue])

  const calcularTotal = () => {
    const cant = typeof cantidad === 'number' ? cantidad : parseFloat(String(cantidad)) || 0
    const precio = typeof precioUnitario === 'number' ? precioUnitario : parseFloat(String(precioUnitario)) || 0
    return cant * precio
  }

  const onSubmit = async (data: VentaFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        proyecto_id: proyectoId,
        producto_id: data.producto_id,
        comprador_nombre: data.comprador_nombre,
        comprador_telefono: data.comprador_telefono || undefined,
        comprador_email: data.comprador_email || undefined,
        comprador_notas: data.comprador_notas || undefined,
        cantidad: data.cantidad,
        precio_unitario: data.precio_unitario,
        fecha_venta: data.fecha_venta || undefined,
        estado_pago: data.estado_pago,
        metodo_pago: data.estado_pago === "pagado" ? data.metodo_pago : undefined,
      }

      const { createProyectoVenta } = await import("@/app/actions/comites-actions")
      const result = await createProyectoVenta(payload)

      if (!result.success) {
        throw new Error(result.error || "Error al registrar venta")
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/dashboard/comites/${comiteId}/proyectos/${proyectoId}`)
        router.refresh()
      }
    } catch (err) {
      console.error("Error al registrar venta:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsSubmitting(false)
    }
  }

  const productosActivos = productos.filter((p) => p.estado === "activo")

  if (productosActivos.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <ShoppingCart className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-amber-900 mb-2">No hay productos disponibles</h3>
        <p className="text-amber-700">
          Debes crear al menos un producto activo antes de registrar ventas.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Producto */}
      <div>
        <label htmlFor="producto_id" className="block text-sm font-medium text-slate-700 mb-2">
          Producto <span className="text-red-500">*</span>
        </label>
        <select
          id="producto_id"
          {...register("producto_id")}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">Selecciona un producto</option>
          {productosActivos.map((producto) => (
            <option key={producto.id} value={producto.id}>
              {producto.nombre} - ${producto.precio_unitario.toLocaleString("es-CO")}
            </option>
          ))}
        </select>
        {errors.producto_id && (
          <p className="mt-1 text-sm text-red-600">{errors.producto_id.message}</p>
        )}
      </div>

      {/* Datos del Comprador */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Datos del Comprador</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="md:col-span-2">
            <label htmlFor="comprador_nombre" className="block text-sm font-medium text-slate-700 mb-2">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              id="comprador_nombre"
              type="text"
              {...register("comprador_nombre")}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Nombre del comprador"
            />
            {errors.comprador_nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.comprador_nombre.message}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="comprador_telefono" className="block text-sm font-medium text-slate-700 mb-2">
              Teléfono (Opcional)
            </label>
            <input
              id="comprador_telefono"
              type="tel"
              {...register("comprador_telefono")}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="3001234567"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="comprador_email" className="block text-sm font-medium text-slate-700 mb-2">
              Email (Opcional)
            </label>
            <input
              id="comprador_email"
              type="email"
              {...register("comprador_email")}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="email@ejemplo.com"
            />
            {errors.comprador_email && (
              <p className="mt-1 text-sm text-red-600">{errors.comprador_email.message}</p>
            )}
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <label htmlFor="comprador_notas" className="block text-sm font-medium text-slate-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              id="comprador_notas"
              {...register("comprador_notas")}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Información adicional del comprador..."
            />
          </div>
        </div>
      </div>

      {/* Detalles de la Venta */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Detalles de la Venta</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cantidad */}
          <div>
            <label htmlFor="cantidad" className="block text-sm font-medium text-slate-700 mb-2">
              Cantidad <span className="text-rose-500">*</span>
            </label>
            <input
              id="cantidad"
              type="number"
              {...register("cantidad", {
                valueAsNumber: true,
                required: "La cantidad es requerida",
                min: { value: 1, message: "La cantidad debe ser mayor a cero" },
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0"
              disabled={isSubmitting}
            />
            {errors.cantidad && (
              <p className="text-xs text-rose-600 mt-1">{errors.cantidad.message}</p>
            )}
          </div>

          {/* Precio Unitario */}
          <div>
            <label htmlFor="precio_unitario" className="block text-sm font-medium text-slate-700 mb-2">
              Precio Unitario <span className="text-rose-500">*</span>
            </label>
            <input
              id="precio_unitario"
              type="number"
              step="0.01"
              {...register("precio_unitario", {
                valueAsNumber: true,
                required: "El precio es requerido",
                min: { value: 0.01, message: "El precio debe ser mayor a cero" },
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              disabled={isSubmitting}
            />
            {errors.precio_unitario && (
              <p className="text-xs text-rose-600 mt-1">{errors.precio_unitario.message}</p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="fecha_venta" className="block text-sm font-medium text-slate-700 mb-2">
              Fecha de Venta
            </label>
            <input
              id="fecha_venta"
              type="date"
              {...register("fecha_venta")}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Total */}
        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-900">Valor Total:</span>
            <span className="text-2xl font-bold text-purple-600">
              ${calcularTotal().toLocaleString("es-CO")}
            </span>
          </div>
        </div>
      </div>

      {/* Estado de Pago */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Estado de Pago</h3>
        
        {/* Radio buttons para estado */}
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-all">
            <input
              type="radio"
              value="pendiente"
              {...register("estado_pago")}
              className="mt-1 w-4 h-4 text-purple-600 focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-semibold text-slate-900 mb-1">Pendiente de Pago</div>
              <div className="text-sm text-slate-600">
                El comprador pagará posteriormente. Se registrará como venta pendiente.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-green-300 hover:bg-green-50/50 transition-all">
            <input
              type="radio"
              value="pagado"
              {...register("estado_pago")}
              className="mt-1 w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
            />
            <div className="flex-1">
              <div className="font-semibold text-slate-900 mb-1">Pagado en el Momento</div>
              <div className="text-sm text-slate-600">
                El comprador ya realizó el pago. Se registrará como venta pagada.
              </div>
            </div>
          </label>
        </div>

        {/* Método de pago - mostrar solo si está marcado como pagado */}
        {estadoPago === "pagado" && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <label htmlFor="metodo_pago" className="block text-sm font-medium text-slate-900 mb-3">
              Método de Pago <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-green-400 hover:bg-white transition-all">
                <input
                  type="radio"
                  value="efectivo"
                  {...register("metodo_pago")}
                  className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-slate-700">💵 Efectivo</span>
              </label>

              <label className="flex items-center gap-2 p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-green-400 hover:bg-white transition-all">
                <input
                  type="radio"
                  value="transferencia"
                  {...register("metodo_pago")}
                  className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-slate-700">🏦 Transferencia</span>
              </label>

              <label className="flex items-center gap-2 p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-green-400 hover:bg-white transition-all">
                <input
                  type="radio"
                  value="tarjeta"
                  {...register("metodo_pago")}
                  className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-slate-700">💳 Tarjeta</span>
              </label>

              <label className="flex items-center gap-2 p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-green-400 hover:bg-white transition-all">
                <input
                  type="radio"
                  value="otro"
                  {...register("metodo_pago")}
                  className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-slate-700">📋 Otro</span>
              </label>
            </div>
            {errors.metodo_pago && (
              <p className="mt-2 text-sm text-red-600">{errors.metodo_pago.message}</p>
            )}
          </div>
        )}
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
          className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Registrar Venta
            </>
          )}
        </button>
      </div>
    </form>
  )
}
