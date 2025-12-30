'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'
import { MiembroCombobox } from '@/components/miembros/MiembroCombobox'
import { Plus, Target } from 'lucide-react'

type TablaVotos = Database['public']['Tables']['votos']['Insert']
type TablaMiembros = Database['public']['Tables']['miembros']['Row']
type Proposito = Database['public']['Tables']['propositos']['Row']

interface NuevoVotoFormProps {
  miembros: Pick<TablaMiembros, 'id' | 'nombres' | 'apellidos'>[]
}

export function NuevoVotoForm({ miembros }: NuevoVotoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    proposito: '',
    montoTotal: '',
    fechaLimite: '',
    miembroId: '' as string | null,
    propositoId: '' as string | null
  })
  const [propositos, setPropositos] = useState<Proposito[]>([])
  const [showNuevoPropositoModal, setShowNuevoPropositoModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Cargar propósitos activos
  useEffect(() => {
    async function loadPropositos() {
      const { data } = await supabase
        .from('propositos')
        .select('*')
        .eq('estado', 'activo')
        .order('nombre')
      
      if (data) {
        setPropositos(data as Proposito[])
      }
    }
    loadPropositos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirect=/dashboard/votos/nuevo')
        return
      }

      const nuevoVoto: TablaVotos = {
        proposito: formData.proposito,
        proposito_id: formData.propositoId || null,
        monto_total: parseFloat(formData.montoTotal),
        fecha_limite: formData.fechaLimite,
        miembro_id: formData.miembroId,
        estado: 'activo',
        recaudado: 0,
        creado_por: session.user.id,
        ultima_actualizacion_por: session.user.id
      } as TablaVotos

      const { error: insertError } = await supabase
        .from('votos')
        .insert([nuevoVoto] as any)
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      router.push('/dashboard/votos')
      router.refresh()
    } catch (error: any) {
      console.error('Error al crear voto:', error)
      setError(error.message || 'Error al crear el voto')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <>
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3">
          <svg className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error al crear el voto</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selector de Propósito (requerido) */}
        <div className="space-y-2">
          <label htmlFor="propositoId" className="block text-sm font-semibold text-gray-900">
            Asociar a un Propósito <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              id="propositoId"
              name="propositoId"
              value={formData.propositoId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, propositoId: e.target.value || null }))}
              required
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Seleccione un propósito</option>
              {propositos.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => router.push('/dashboard/propositos/nuevo')}
              className="inline-flex items-center gap-2 px-4 py-3 border border-blue-600 text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-colors"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          </div>
          <p className="text-xs text-gray-500 flex items-center space-x-1">
            <Target className="h-4 w-4" />
            <span>Selecciona el propósito al que pertenece este compromiso financiero</span>
          </p>
        </div>

        {/* Propósito */}
        <div className="space-y-2">
          <label htmlFor="proposito" className="block text-sm font-semibold text-gray-900">
            Descripción del Voto (opcional)
          </label>
          <textarea
            id="proposito"
            name="proposito"
            value={formData.proposito}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            rows={4}
            placeholder="Ej: Contribución para misiones, construcción de templo, ayuda humanitaria..."
          />
          <p className="text-xs text-gray-500 flex items-center space-x-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Agrega detalles adicionales sobre este compromiso (opcional)</span>
          </p>
        </div>

        {/* Grid de Monto y Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="montoTotal" className="block text-sm font-semibold text-gray-900">
              Monto Total <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                id="montoTotal"
                name="montoTotal"
                value={formData.montoTotal}
                onChange={handleChange}
                required
                min="1"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500">Monto total del compromiso en COP</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="fechaLimite" className="block text-sm font-semibold text-gray-900">
              Fecha Límite <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="fechaLimite"
              name="fechaLimite"
              value={formData.fechaLimite}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500">Fecha límite para completar el voto</p>
          </div>
        </div>

        {/* Selector de Miembro */}
        <div className="space-y-2">
          <label htmlFor="miembroId" className="block text-sm font-semibold text-gray-900">
            Miembro <span className="text-red-500">*</span>
          </label>
          <MiembroCombobox
            miembros={miembros}
            value={formData.miembroId || ''}
            onChange={(id) => setFormData(prev => ({ ...prev, miembroId: id }))}
            placeholder="Buscar por nombre, apellido o cédula..."
            disabled={loading}
          />
          <p className="text-xs text-gray-500 flex items-center space-x-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Selecciona el miembro responsable del compromiso</span>
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creando voto...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Crear Voto</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </>
  )
}
