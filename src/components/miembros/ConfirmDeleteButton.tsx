'use client'

import { useState } from 'react'
import { eliminarMiembro } from '@/app/actions/miembros'
import styles from '@/styles/miembros.module.css'

interface ConfirmDeleteButtonProps {
  miembroId: string
}

export function ConfirmDeleteButton({ miembroId }: ConfirmDeleteButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    try {
      const result = await eliminarMiembro(miembroId)
      if (result.error) {
        setError(result.error)
      }
      setIsConfirming(false)
    } catch (error: any) {
      setError(error.message)
    }
  }

  if (isConfirming) {
    return (
      <div className={styles['confirm-delete']}>
        <p>¿Estás seguro?</p>
        <div className={styles['confirm-actions']}>
          <button 
            onClick={() => setIsConfirming(false)}
            className={styles['btn-secondary']}
          >
            Cancelar
          </button>
          <button 
            onClick={handleDelete}
            className={styles['btn-danger']}
          >
            Eliminar
          </button>
        </div>
        {error && <p className={styles['error-message']}>{error}</p>}
      </div>
    )
  }

  return (
    <button 
      onClick={() => setIsConfirming(true)}
      className={styles['btn-danger']}
    >
      Eliminar
    </button>
  )
}