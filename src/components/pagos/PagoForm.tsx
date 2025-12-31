'use client'

import React, { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { redirect } from 'next/navigation'
import { procesarPago, ActionResponse, ActionState } from '@/app/actions/registro-pago'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import styles from '@/styles/components/PagoForm.module.css'

interface PagoFormProps {
  votoId: string
  montoTotal: number
  recaudado: number
  onSuccess?: () => void
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button 
      type="submit" 
      className={styles.submitButton}
      disabled={pending}
    >
      {pending ? (
        <>
          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Procesando...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Registrar Pago
        </>
      )}
    </button>
  )
}

const PagoForm: React.FC<PagoFormProps> = ({ votoId, montoTotal, recaudado, onSuccess }) => {
  const initialState: ActionResponse = { 
    error: null,
    success: false
  }

  const [state, formAction] = useFormState(
    async (prevState: ActionResponse, formData: FormData) => {
      try {
        return await procesarPago(votoId, null, formData)
      } catch (error) {
        return {
          error: 'Error al procesar el pago',
          success: false
        }
      }
    },
    initialState
  )

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto)
  }

  useEffect(() => {
    if (state?.success) {
      onSuccess?.()
    }
  }, [state, onSuccess])

  const montoPendiente = montoTotal - recaudado
  return (
    <form action={formAction} className={styles.form}>
      {state?.error && (
        <div className={styles.error}>
          <div className={styles.errorContent}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{state.error}</span>
          </div>
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="monto" className={styles.label}>Monto del Pago</label>
        <div className={styles.inputWrapper}>
          <span className={styles.currencySymbol}>$</span>
          <input
            type="number"
            name="monto"
            id="monto"
            min="0"
            max={montoPendiente}
            required
            className={styles.currencyInput}
            placeholder="0"
          />
        </div>
        <span className={styles.helperText}>
          Monto máximo: {formatearMonto(montoPendiente)}
        </span>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="fecha" className={styles.label}>Fecha del Pago</label>
        <input
          type="date"
          name="fecha"
          id="fecha"
          max={new Date().toISOString().split('T')[0]}
          className={styles.input}
        />
        <span className={styles.helperText}>
          Si no se especifica, se usará la fecha actual
        </span>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="nota" className={styles.label}>Nota (opcional)</label>
        <textarea
          name="nota"
          id="nota"
          className={styles.input}
          rows={3}
          placeholder="Agregar una nota al pago..."
        />
      </div>

      <SubmitButton />
    </form>
  )
}

export default PagoForm