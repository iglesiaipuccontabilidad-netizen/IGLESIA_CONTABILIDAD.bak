// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import toast from 'react-hot-toast'
import { Save, X } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Proposito = Database['public']['Tables']['propositos']['Row']
type PropositoInsert = Database['public']['Tables']['propositos']['Insert']
type PropositoUpdate = Database['public']['Tables']['propositos']['Update']

interface PropositoFormProps {
  proposito?: Proposito
  mode?: 'create' | 'edit'
}

export default function PropositoForm({ proposito, mode = 'create' }: PropositoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<PropositoInsert>>({
    nombre: proposito?.nombre || '',
    descripcion: proposito?.descripcion || '',
    monto_objetivo: proposito?.monto_objetivo || undefined,
    fecha_inicio: proposito?.fecha_inicio || new Date().toISOString().split('T')[0],
    fecha_fin: proposito?.fecha_fin || '',
    estado: proposito?.estado || 'activo'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monto_objetivo' ? (value ? parseFloat(value) : undefined) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones de formulario
    if (!formData.nombre?.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    // Validar monto objetivo si se proporciona
    const montoObjetivo = formData.monto_objetivo
    if (montoObjetivo != null && montoObjetivo <= 0) {
      toast.error('El monto objetivo debe ser mayor a 0')
      return
    }

    // Validar fechas
    if (formData.fecha_inicio && formData.fecha_fin) {
      if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
        toast.error('La fecha de finalización no puede ser anterior a la fecha de inicio')
        return
      }
    }

    setLoading(true)
    let toastId: string | undefined

    try {
      const supabase = getSupabaseBrowserClient()
      // Verificar sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw new Error('Error al verificar la sesión')
      if (!session) throw new Error('No hay sesión activa')

      // Mostrar toast de carga
      toastId = toast.loading(mode === 'create' ? 'Creando propósito...' : 'Actualizando propósito...').toString()

      // Preparar datos base
      const baseData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        monto_objetivo: formData.monto_objetivo || null,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null,
        estado: formData.estado || 'activo',
        ultima_actualizacion_por: session.user.id
      }

      if (mode === 'create') {
        const dataToInsert: PropositoInsert = {
          ...baseData,
          creado_por: session.user.id,
          created_at: new Date().toISOString(),
          monto_recaudado: 0
        }

        const { error: insertError, data } = await supabase
          .from('propositos')
          .insert(dataToInsert)
          .select('*')
          .single()

        if (insertError) {
          if (insertError.code === '23505') { // Código de error de unique constraint
            throw new Error('Ya existe un propósito con este nombre')
          }
          throw insertError
        }

        if (!data) throw new Error('No se pudo crear el propósito')
        
        toast.success('Propósito creado exitosamente', { id: toastId })
      } else if (mode === 'edit' && proposito?.id) {
        const updateData = {
          ...baseData,
          updated_at: new Date().toISOString()
        } satisfies PropositoUpdate

        const { error: updateError } = await supabase
          .from('propositos')
          .update(updateData)
          .eq('id', proposito.id)
          .select('*')

        if (updateError) throw updateError

        toast.success('Propósito actualizado exitosamente', { id: toastId })
      }

      // Esperar un momento antes de redirigir
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      router.push('/dashboard/propositos')
      router.refresh()
    } catch (error: any) {
      console.error('Error al guardar propósito:', error)
      
      // Asegurarse de que el toast de error se muestre
      if (toastId) {
        toast.error(
          error.message || 'Error al guardar el propósito. Por favor, inténtalo de nuevo.', 
          { id: toastId, duration: 5000 }
        )
      } else {
        toast.error(
          error.message || 'Error al guardar el propósito. Por favor, inténtalo de nuevo.',
          { duration: 5000 }
        )
      }
    } finally {
      // Si por alguna razón el toast no se cerró, lo cerramos
      if (!toastId) {
        toast.dismiss()
      }
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <div className="space-y-6">
        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className="block text-sm font-semibold text-slate-900 mb-2">
            Nombre del Propósito *
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            disabled={loading}
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
            value={formData.descripcion || ''}
            onChange={handleChange}
            disabled={loading}
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
              value={formData.monto_objetivo || ''}
              onChange={handleChange}
              disabled={loading}
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
              value={formData.fecha_inicio || ''}
              onChange={handleChange}
              disabled={loading}
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
              value={formData.fecha_fin || ''}
              onChange={handleChange}
              disabled={loading}
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
            value={formData.estado}
            onChange={handleChange}
            disabled={loading}
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
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Guardando...' : mode === 'create' ? 'Crear Propósito' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}
