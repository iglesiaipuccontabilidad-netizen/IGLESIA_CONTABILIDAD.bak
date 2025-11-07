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
      {/* Header con navegación */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 group"
        >
          <svg 
            className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a la lista de votos
        </button>
        <h1 className="text-slate-900 text-2xl font-semibold">Registrar Nuevo Pago</h1>
      </div>

      {/* Detalles del Voto - Card mejorada */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 via-slate-50 to-cyan-50">
          <h2 className="text-slate-900 text-lg font-medium flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Detalles del Voto
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-4 border border-slate-200">
              <label className="text-slate-600 text-sm font-medium block mb-1">Propósito</label>
              <p className="text-slate-900 font-semibold">
                Baños
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-4 border border-slate-200">
              <label className="text-slate-600 text-sm font-medium block mb-1">Miembro</label>
              <p className="text-slate-900 font-semibold">
                Juan David Aguilar
              </p>
            </div>
            <div className="relative bg-gradient-to-br from-primary-50 to-white rounded-lg p-4 border border-primary-100">
              <div className="absolute top-0 right-0 mt-2 mr-2">
                <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <label className="text-slate-600 text-sm font-medium block mb-1">Monto Total</label>
              <p className="text-primary-700 text-2xl font-bold tracking-tight">
                ${montoTotal.toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          {/* Barra de Progreso y Monto Pendiente */}
          <div className="bg-gradient-to-r from-rose-50 via-slate-50 to-emerald-50 rounded-lg p-4 border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <label className="text-slate-600 text-sm font-medium">Estado del Pago</label>
              <span className="text-rose-500 text-sm font-medium">
                Pendiente: ${montoPendiente.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-200">
                <div 
                  style={{ width: `${((montoTotal - montoPendiente) / montoTotal * 100).toFixed(1)}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-cyan-500"
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-semibold text-emerald-600">
                  Pagado: ${(montoTotal - montoPendiente).toLocaleString('es-CO')}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {((montoTotal - montoPendiente) / montoTotal * 100).toFixed(1)}% completado
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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