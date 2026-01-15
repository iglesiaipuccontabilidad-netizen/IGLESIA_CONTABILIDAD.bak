// @ts-nocheck
'use client'

import { useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProposito } from '@/app/actions/propositos-actions'
import toast from 'react-hot-toast'
import { Save, X } from 'lucide-react'
import type { Database } from '@/lib/database.types'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'

type Proposito = Database['public']['Tables']['propositos']['Row']
type PropositoInsert = Database['public']['Tables']['propositos']['Insert']
type PropositoUpdate = Database['public']['Tables']['propositos']['Update']

interface PropositoFormProps {
  proposito?: Proposito
  mode?: 'create' | 'edit'
}

export default function PropositoForm({ proposito, mode = 'create' }: PropositoFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<PropositoInsert>>({
    nombre: proposito?.nombre || '',
    descripcion: proposito?.descripcion || '',
    monto_objetivo: proposito?.monto_objetivo || undefined,
    fecha_inicio: proposito?.fecha_inicio || new Date().toISOString().split('T')[0],
    fecha_fin: proposito?.fecha_fin || '',
    estado: proposito?.estado || 'activo'
  })

  // Estado inicial para useActionState
  const initialState = {
    success: false,
    error: null as string | null
  }

  // Server Action con useActionState
  const [state, formAction, pending] = useActionState(async (prevState: any, formDataForm: FormData) => {
    try {
      // Extraer datos del FormData
      const nombre = formDataForm.get('nombre') as string
      const descripcion = formDataForm.get('descripcion') as string
      const monto_objetivo = formDataForm.get('monto_objetivo') as string
      const fecha_inicio = formDataForm.get('fecha_inicio') as string
      const fecha_fin = formDataForm.get('fecha_fin') as string
      const estado = formDataForm.get('estado') as string

      // Validaciones
      if (!nombre?.trim()) {
        return { success: false, error: 'El nombre es requerido' }
      }

      // Validar monto objetivo si se proporciona
      const montoObjetivo = monto_objetivo ? parseFloat(monto_objetivo) : null
      if (montoObjetivo != null && montoObjetivo <= 0) {
        return { success: false, error: 'El monto objetivo debe ser mayor a 0' }
      }

      // Validar fechas
      if (fecha_inicio && fecha_fin) {
        if (new Date(fecha_fin) < new Date(fecha_inicio)) {
          return { success: false, error: 'La fecha de finalización no puede ser anterior a la fecha de inicio' }
        }
      }

      // Preparar datos para la Server Action
      const updateData = {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        monto_objetivo: montoObjetivo,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        estado: estado || 'activo'
      }

      // Llamar a la Server Action
      const result = await updateProposito(proposito!.id, updateData)

      if (!result.success) {
        return { success: false, error: result.error?.message || 'Error al actualizar el propósito' }
      }

      // Éxito
      toast.success('Propósito actualizado exitosamente')
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push('/dashboard/propositos')
        router.refresh()
      }, 1000)

      return { success: true, error: null }

    } catch (error: any) {
      console.error('Error en form action:', error)
      return { success: false, error: error.message || 'Error inesperado' }
    }
  }, initialState)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monto_objetivo' ? (value ? parseFloat(value) : undefined) : value
    }))
  }

  return (
    <form action={formAction} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <div className="space-y-6">
        {/* Mostrar error del state si existe */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm font-medium">{state.error}</p>
          </div>
        )}

        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className="block text-sm font-semibold text-slate-900 mb-2">
            Nombre del Propósito *
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            defaultValue={formData.nombre}
            disabled={pending}
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ej: Construcción del nuevo templo"
          />
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="descripcion" className="block text-sm font-semibold text-slate-900 mb-2">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            defaultValue={formData.descripcion || ''}
            disabled={pending}
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            placeholder="Describe el propósito de esta campaña..."
          />
        </div>

        {/* Monto Objetivo */}
        <div>
          <label htmlFor="monto_objetivo" className="block text-sm font-semibold text-slate-900 mb-2">
            Monto Objetivo
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
              $
            </span>
            <input
              type="number"
              id="monto_objetivo"
              name="monto_objetivo"
              defaultValue={formData.monto_objetivo || ''}
              disabled={pending}
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="0.00"
            />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Meta financiera a alcanzar (opcional)
          </p>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fecha_inicio" className="block text-sm font-semibold text-slate-900 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              id="fecha_inicio"
              name="fecha_inicio"
              defaultValue={formData.fecha_inicio || ''}
              disabled={pending}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="fecha_fin" className="block text-sm font-semibold text-slate-900 mb-2">
              Fecha de Finalización
            </label>
            <input
              type="date"
              id="fecha_fin"
              name="fecha_fin"
              defaultValue={formData.fecha_fin || ''}
              disabled={pending}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="estado" className="block text-sm font-semibold text-slate-900 mb-2">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue={formData.estado}
            disabled={pending}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="activo">Activo</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={pending}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <Save className="w-5 h-5" />
          {pending ? 'Guardando...' : mode === 'create' ? 'Crear Propósito' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}
