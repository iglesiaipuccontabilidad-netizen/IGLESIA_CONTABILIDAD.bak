'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/styles/miembros.module.css'
import { MiembroFormData, MiembroError } from '@/types/miembros'

interface MiembroFormProps {
  miembro?: MiembroFormData
  onSubmit: (data: MiembroFormData) => Promise<void>
}

export function MiembroForm({ miembro, onSubmit }: MiembroFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<MiembroError>({})

  const [formData, setFormData] = useState<MiembroFormData>(
    miembro || {
      nombres: '',
      apellidos: '',
      cedula: '',
      email: '',
      telefono: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      estado: 'activo',
      rol: 'miembro'
    }
  )

  const validateForm = () => {
    const newErrors: MiembroError = {}

    if (!formData.nombres) {
      newErrors.nombres = 'El nombre es requerido'
    }
    if (!formData.apellidos) {
      newErrors.apellidos = 'Los apellidos son requeridos'
    }
    if (!formData.cedula) {
      newErrors.cedula = 'La cédula es requerida'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await onSubmit(formData)
      router.push('/dashboard/miembros')
      router.refresh()
    } catch (error) {
      console.error('Error al guardar miembro:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles['miembro-form']}>
      <div className={styles['form-group']}>
        <label htmlFor="nombres">Nombres*</label>
        <input
          type="text"
          id="nombres"
          value={formData.nombres}
          onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
          className={errors.nombres ? styles['input-error'] : ''}
        />
        {errors.nombres && <span className={styles['error-message']}>{errors.nombres}</span>}
      </div>

      <div className={styles['form-group']}>
        <label htmlFor="apellidos">Apellidos*</label>
        <input
          type="text"
          id="apellidos"
          value={formData.apellidos}
          onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
          className={errors.apellidos ? styles['input-error'] : ''}
        />
        {errors.apellidos && <span className={styles['error-message']}>{errors.apellidos}</span>}
      </div>

      <div className={styles['form-group']}>
        <label htmlFor="cedula">Cédula*</label>
        <input
          type="text"
          id="cedula"
          value={formData.cedula}
          onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
          className={errors.cedula ? styles['input-error'] : ''}
        />
        {errors.cedula && <span className={styles['error-message']}>{errors.cedula}</span>}
      </div>

      <div className={styles['form-group']}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={errors.email ? styles['input-error'] : ''}
        />
        {errors.email && <span className={styles['error-message']}>{errors.email}</span>}
      </div>

      <div className={styles['form-group']}>
        <label htmlFor="telefono">Teléfono</label>
        <input
          type="tel"
          id="telefono"
          value={formData.telefono ?? ''}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          className={errors.telefono ? styles['input-error'] : ''}
        />
        {errors.telefono && <span className={styles['error-message']}>{errors.telefono}</span>}
      </div>

      <div className={styles['form-actions']}>
        <button 
          type="button" 
          onClick={() => router.back()}
          className={styles['btn-secondary']}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isPending}
          className={styles['btn-primary']}
        >
          {isPending ? 'Guardando...' : miembro ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
