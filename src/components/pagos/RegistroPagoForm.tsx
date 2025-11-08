'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/database.types'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface PagoFormData {
  monto: string
  fecha_pago: string
  metodo_pago: 'efectivo' | 'transferencia' | 'cheque' | 'otro'
  nota: string
}

interface RegistroPagoFormProps {
  votoId: string
  montoPendiente: number
  montoTotal: number
}

type UsuarioPermisos = Pick<Database['public']['Tables']['usuarios']['Row'], 'rol' | 'estado'>

export default function RegistroPagoForm({ votoId, montoPendiente, montoTotal }: RegistroPagoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<PagoFormData>({
    monto: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    nota: ''
  })
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading) return
    
    // Validaciones iniciales del formulario
    const monto = Math.round(parseFloat(formData.monto) * 100) / 100
    if (isNaN(monto) || monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }
    if (monto > montoPendiente) {
      toast.error(`El monto máximo permitido es $${montoPendiente.toLocaleString('es-CO')}`)
      return
    }
    if (!formData.fecha_pago) {
      toast.error('La fecha de pago es requerida')
      return
    }

    setLoading(true)
    setError(null)
    
    const toastId = toast.loading('Procesando pago...')

    try {
      // 1. Verificar sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw new Error('Error al verificar la sesión')
      }
      
      if (!session?.user) {
        const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search)
        router.push(`/login?redirect=${redirectUrl}`)
        return
      }

      // 2. Registrar pago
      const { data: result, error: txError } = await (supabase.rpc as any)('registrar_pago', {
        p_voto_id: votoId,
        p_monto: monto,
        p_fecha_pago: formData.fecha_pago,
        p_metodo_pago: formData.metodo_pago as string,
        p_nota: formData.nota?.trim() || null,
        p_registrado_por: session.user.id,
        p_monto_total: montoTotal
      })

      // Manejar errores de la transacción
      if (txError) {
        throw new Error(txError.message || 'Error al procesar el pago')
      }

      if (!result || !(result as any).success) {
        throw new Error('No se pudo registrar el pago. Por favor, intenta de nuevo.')
      }

      // 3. Éxito - Mostrar mensaje y esperar un momento
      toast.success('¡Pago registrado exitosamente!', { id: toastId })
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 4. Redireccionar
      router.push(`/dashboard/votos/${votoId}`)
      router.refresh()
    } catch (error: any) {
      console.error('Error al procesar pago:', error)
      const errorMessage = error.message || 'Error al procesar el pago. Por favor, intenta de nuevo.'
      setError(errorMessage)
      toast.error(errorMessage, { id: toastId })
    } finally {
      if (!error) {
        toast.dismiss(toastId)
      }
      setLoading(false)
    }
  }

  // Manejador de cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Formulario de Pago */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-slate-900 text-lg font-medium">Información del Pago</h2>
          <p className="text-slate-500 text-sm mt-1">Completa los detalles del pago a registrar</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Monto del Pago */}
          <div className="relative">
            <label htmlFor="monto" className="block text-slate-700 text-sm font-medium mb-2">
              Monto del Pago <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-500">$</span>
              </div>
              <input
                type="number"
                id="monto"
                name="monto"
                value={formData.monto}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 pl-8 pr-4 py-2.5
                         focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                         placeholder:text-slate-400 transition-colors"
                required
                min="1"
                max={montoPendiente}
                step="0.01"
              />
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              Monto máximo permitido: ${montoPendiente.toLocaleString('es-CO')}
            </p>
          </div>

          {/* Grid de 2 columnas para fecha y método */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha del Pago */}
            <div>
              <label htmlFor="fecha_pago" className="block text-slate-700 text-sm font-medium mb-2">
                Fecha del Pago <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="date"
                  id="fecha_pago"
                  name="fecha_pago"
                  value={formData.fecha_pago}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5
                           focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                           transition-colors"
                  required
                />
              </div>
            </div>

            {/* Método de Pago */}
            <div>
              <label htmlFor="metodo_pago" className="block text-slate-700 text-sm font-medium mb-2">
                Método de Pago <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="metodo_pago"
                  name="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 pl-4 pr-10 py-2.5
                           focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                           bg-white appearance-none transition-colors"
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="otro">Otro</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Nota */}
          <div>
            <label htmlFor="nota" className="block text-slate-700 text-sm font-medium mb-2">
              Nota <span className="text-slate-400">(opcional)</span>
            </label>
            <div className="relative">
              <textarea
                id="nota"
                name="nota"
                value={formData.nota}
                onChange={handleChange}
                placeholder="Añade detalles adicionales sobre el pago..."
                className="w-full rounded-lg border border-slate-200 px-4 py-3
                         focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                         placeholder:text-slate-400 min-h-[100px] transition-colors"
                rows={3}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 flex items-start">
              <svg className="h-5 w-5 text-rose-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-rose-500 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 
                     hover:bg-slate-100 hover:border-slate-400 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-slate-200
                     disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg inline-flex items-center justify-center
                     bg-gradient-to-r from-primary-500 via-primary-600 to-cyan-500 
                     text-white font-medium shadow-sm
                     hover:from-primary-600 hover:to-cyan-600 
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                     transition-all duration-150 
                     disabled:opacity-60 disabled:cursor-not-allowed
                     min-w-[120px]"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Registrar Pago</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}