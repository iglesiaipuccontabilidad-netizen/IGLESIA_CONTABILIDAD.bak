"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, X, Package } from "lucide-react"
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"

const productoSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  descripcion: z.string().optional(),
  precio_unitario: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "El precio debe ser mayor a cero",
  }),
})

type ProductoFormData = z.infer<typeof productoSchema>

interface ProyectoProductoFormProps {
  proyectoId: string
  comiteId: string
  initialData?: Partial<ProductoFormData & { id?: string }>
  productoId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProyectoProductoForm({
  proyectoId,
  comiteId,
  initialData,
  productoId,
  onSuccess,
  onCancel,
}: ProyectoProductoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: initialData?.nombre || "",
      descripcion: initialData?.descripcion || "",
      precio_unitario: initialData?.precio_unitario || "",
    },
  })

  const onSubmit = async (data: ProductoFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        proyecto_id: proyectoId,
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        precio_unitario: parseFloat(data.precio_unitario),
      }

      const { createProyectoProducto, updateProyectoProducto } = await import(
        "@/app/actions/comites-actions"
      )

      const result = productoId
        ? await updateProyectoProducto(productoId, payload)
        : await createProyectoProducto(payload)

      if (!result.success) {
        throw new Error(result.error || "Error al guardar producto")
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/dashboard/comites/${comiteId}/proyectos/${proyectoId}`)
        router.refresh()
      }
    } catch (err) {
      console.error("Error al guardar producto:", err)
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

      {/* Nombre del Producto */}
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-2">
          Nombre del Producto <span className="text-red-500">*</span>
        </label>
        <input
          id="nombre"
          type="text"
          {...register("nombre")}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Ej: Armadaque familiar"
        />
        {errors.nombre && (
          <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-2">
          Descripción (Opcional)
        </label>
        <textarea
          id="descripcion"
          {...register("descripcion")}
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder="Descripción del producto..."
        />
        {errors.descripcion && (
          <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
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
            required: "El precio es requerido",
            valueAsNumber: true,
            min: { value: 0.01, message: "El precio debe ser mayor a 0" },
          })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
          disabled={isSubmitting}
        />
        {errors.precio_unitario && (
          <p className="text-xs text-rose-600 mt-1">{errors.precio_unitario.message}</p>
        )}
        {!errors.precio_unitario && (
          <p className="text-xs text-slate-500 mt-1">Precio de venta por unidad del producto</p>
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
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {productoId ? "Actualizar" : "Crear"} Producto
            </>
          )}
        </button>
      </div>
    </form>
  )
}
