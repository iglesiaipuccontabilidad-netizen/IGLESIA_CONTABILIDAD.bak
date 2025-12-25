'use client'

import { useState } from 'react'
import styles from '@/styles/components/CrearUsuarioForm.module.css'

interface CrearUsuarioFormProps {
  onSuccess?: () => void
}

const CrearUsuarioForm: React.FC<CrearUsuarioFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const rol = formData.get('rol') as string

    // Validaciones del lado del cliente
    if (!email || !password || !rol) {
      setError('Todos los campos son requeridos')
      setIsLoading(false)
      return
    }

    // Validar formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('El formato del correo electrónico no es válido')
      setIsLoading(false)
      return
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setIsLoading(false)
      return
    }

    // Validar complejidad de la contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/
    if (!passwordRegex.test(password)) {
      setError('La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial')
      setIsLoading(false)
      return
    }

    try {
      console.log('Enviando datos:', { email, rol }) // No logueamos la contraseña por seguridad
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rol }),
      })

      // Verificar el content-type de la respuesta
      const contentType = response.headers.get('content-type')
      console.log('Content-Type de respuesta:', contentType)
      console.log('Status de respuesta:', response.status)

      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('Respuesta no-JSON recibida:', textResponse.substring(0, 500))
        throw new Error('Error del servidor. Por favor, revisa la consola del navegador.')
      }

      const data = await response.json()
      
      if (!response.ok) {
        console.error('Error de la API:', data)
        throw new Error(data.error || 'Error al crear el usuario')
      }

      console.log('Usuario creado exitosamente:', data)
      
      // Resetear el formulario antes de llamar onSuccess
      e.currentTarget.reset()
      
      // Mostrar mensaje especial si fue reactivado
      if (data.message) {
        setError(data.message)
        setTimeout(() => setError(null), 3000)
      }
      
      onSuccess?.()
      
      // Mostrar mensaje de éxito
      setError(null)
    } catch (error) {
      console.error('Error completo:', error)
      setError(error instanceof Error ? error.message : 'Error al crear el usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formHeader}>
        <h2>Crear Nuevo Usuario</h2>
      </div>

      {error && (
        <div className={styles.error}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>
          Correo Electrónico
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={styles.input}
          required
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="password" className={styles.label}>
          Contraseña
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className={styles.input}
          required
          minLength={6}
          placeholder="Mín. 6 caracteres (mayúsculas, minúsculas, números y caracteres especiales)"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="rol" className={styles.label}>
          Rol
        </label>
        <select
          id="rol"
          name="rol"
          className={styles.select}
          required
          defaultValue=""
        >
          <option value="" disabled>Selecciona un rol</option>
          <option value="usuario">Usuario</option>
          <option value="tesorero">Tesorero</option>
          <option value="admin">Administrador</option>
          <option value="pendiente">Pendiente</option>
        </select>
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Creando usuario...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M19 8l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2"/>
            </svg>
            Crear Usuario
          </>
        )}
      </button>
    </form>
  )
}

export default CrearUsuarioForm