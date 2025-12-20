'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook que fuerza a refetch la sesión del usuario
 * Útil cuando se navega a una ruta protegida después del login
 */
export function useRefreshAuth() {
  const { user, isLoading } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    // Si estamos cargando o ya tenemos usuario, no hacer nada
    if (isLoading || user) {
      return
    }

    // Intentar obtener el usuario nuevamente
    // Esto es útil en caso de timing issues con la sesión
    const refreshSession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!error && data?.user) {
          console.log('Session refreshed:', data.user.email)
        }
      } catch (err) {
        console.error('Error refreshing session:', err)
      }
    }

    // Dar un pequeño delay para permitir que Supabase establezca las cookies
    const timer = setTimeout(refreshSession, 100)
    return () => clearTimeout(timer)
  }, [user, isLoading, supabase])
}
