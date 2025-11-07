'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/styles/pagos.module.css'
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
  const [supabase] = useState(() => createClient())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading) return
    
    let toastId: string | undefined
    
    try {
      setLoading(true)
      setError(null)
      toastId = toast.loading('Verificando sesión...').toString()

      // 1. Verificar sesión
      const session = await supabase.auth.getSession()
      if (!session.data.session?.user) {
        const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search)
        router.push(`/login?redirect=${redirectUrl}`)
        return
      }

      // 2. Actualizar toast
      toast.loading('Procesando pago...', { id: toastId })

      // 3. Validaciones básicas
      const monto = Math.round(parseFloat(formData.monto) * 100) / 100
      if (isNaN(monto) || monto <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }
      if (monto > montoPendiente) {
        throw new Error(`El monto máximo es $${montoPendiente.toLocaleString('es-CO')}`)
      }

      // 3. Registrar pago
      const { data: result, error: txError } = await supabase.rpc(
        'registrar_pago',
        {
          p_voto_id: votoId,
          p_monto: monto,
          p_fecha_pago: formData.fecha_pago,
          p_metodo_pago: formData.metodo_pago,
          p_nota: formData.nota || null,
          p_registrado_por: session.data.session.user.id,
          p_monto_total: montoTotal
        } as any
      )

      if (txError) throw new Error(txError.message)
      if (!result || !(result as any).success) throw new Error('No se pudo registrar el pago')

      // 4. Éxito
      toast.success('Pago registrado con éxito', { id: toastId })
      
      // 5. Redireccionar
      router.refresh()
      router.push(`/dashboard/votos/${votoId}`)
    } catch (error: any) {
      console.error('Error al procesar pago:', error)
      const errorMessage = error.message || 'Error al procesar el pago'
      setError(errorMessage)
      
      if (toastId) {
        toast.dismiss(toastId)
      }
      
      toast.error(errorMessage, {
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  // Manejador de cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="monto" className={styles.label}>
          Monto del Pago *
        </label>
        <input
          type="number"
          id="monto"
          name="monto"
          value={formData.monto}
          onChange={handleChange}
          placeholder="Ingresa el monto del pago"
          className={styles.input}
          required
          min="1"
          max={montoPendiente}
            step="0.01"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="fecha_pago" className={styles.label}>
          Fecha del Pago *
        </label>
        <input
          type="date"
          id="fecha_pago"
          name="fecha_pago"
          value={formData.fecha_pago}
          onChange={handleChange}
          className={`${styles.input} ${styles.dateInput}`}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="metodo_pago" className={styles.label}>
          Método de Pago *
        </label>
        <select
          id="metodo_pago"
          name="metodo_pago"
          value={formData.metodo_pago}
          onChange={handleChange}
          className={styles.input}
          required
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="cheque">Cheque</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="nota" className={styles.label}>
          Nota (opcional)
        </label>
        <textarea
          id="nota"
          name="nota"
          value={formData.nota}
          onChange={handleChange}
          placeholder="Añade una nota o comentario"
          className={styles.input}
          rows={3}
        />
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={() => router.back()}
          className={styles.cancelButton}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={`${styles.submitButton} ${loading ? styles.loading : ''}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Registrando...
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Registrar Pago
            </>
          )}
        </button>
      </div>
    </form>
  )
}