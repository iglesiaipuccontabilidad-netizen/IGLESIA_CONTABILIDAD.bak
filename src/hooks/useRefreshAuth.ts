'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/context/AuthContext'

/**
 * Hook que fuerza a refetch la sesión del usuario
 * Útil cuando se navega a una ruta protegida después del login
 * 
 * NOTA: Este hook ya NO dispara getUser() para evitar loops con onAuthStateChange.
 * AuthContext ya maneja la inicialización completa.
 */
export function useRefreshAuth() {
  const { user, isLoading } = useAuth()
  const hasLogged = useRef(false)

  useEffect(() => {
    // Solo loguear una vez para debugging, no tomar ninguna acción
    if (!isLoading && !user && !hasLogged.current) {
      hasLogged.current = true
      console.log('ℹ️ [useRefreshAuth] Auth terminó de cargar sin usuario — se redirigirá a login')
    }
  }, [user, isLoading])
}
