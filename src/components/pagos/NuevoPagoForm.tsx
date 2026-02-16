'use client'

import { useState } from 'react'
import { useRouter } from '@/lib/hooks/useOrgRouter'
import { toast } from 'react-hot-toast'
import styles from '@/styles/pagos.module.css'
import type { PagoFormData, MetodoPago } from '@/lib/pagos/types'
import { registrarPago } from '@/lib/pagos/service'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'

interface Props {
  votoId: string
  montoPendiente: number
  montoTotal: number
}

const METODOS_PAGO: MetodoPago[] = ['efectivo', 'transferencia', 'cheque', 'otro']

export default function NuevoPagoForm({ votoId, montoPendiente, montoTotal }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PagoFormData>({
    monto: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    nota: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    const loadingToast = toast.loading('Procesando pago...')

    try {
      // Validaciones básicas
      const monto = parseFloat(formData.monto)
      if (isNaN(monto) || monto <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }
      if (monto > montoPendiente) {
        throw new Error(`El monto máximo es $${montoPendiente.toLocaleString('es-CO')}`)
      }

      // Registrar pago
      const { success, error } = await registrarPago(formData, votoId, montoTotal)
      
      if (!success) {
        throw error || new Error('No se pudo registrar el pago')
      }

      // Éxito
      toast.success('Pago registrado exitosamente', { id: loadingToast })
      router.refresh()
      router.push(`/dashboard/votos/${votoId}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al procesar el pago',
        { id: loadingToast }
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="monto" className="block text-sm font-medium text-slate-700 mb-2">
          Monto del Pago <span className="text-rose-500">*</span>
        </label>
        <FormattedNumberInput
          name="monto"
          value={formData.monto || ''}
          onChange={handleChange}
          disabled={loading}
          placeholder="0"
          required
          showCurrency={true}
          showFormatted={false}
          helpText={`Máximo: $${montoPendiente.toLocaleString('es-CO')}`}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          disabled={loading}
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
          disabled={loading}
        >
          {METODOS_PAGO.map(metodo => (
            <option key={metodo} value={metodo}>
              {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
            </option>
          ))}
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
          disabled={loading}
        />
      </div>

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
              <svg 
                className="animate-spin h-5 w-5 mr-2" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Registrando...
            </>
          ) : (
            'Registrar Pago'
          )}
        </button>
      </div>
    </form>
  )
}