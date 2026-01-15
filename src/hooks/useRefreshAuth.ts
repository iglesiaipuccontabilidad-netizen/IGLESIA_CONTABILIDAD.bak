'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'

/**
 * Hook que fuerza a refetch la sesión del usuario
 * Útil cuando se navega a una ruta protegida después del login
 */
export function useRefreshAuth() {
  const { user, isLoading } = useAuth()
  const hasRun = useRef(false)

  useEffect(() => {
    // Si estamos cargando, ya tenemos usuario, o ya corrimos, no hacer nada
    if (isLoading || user || hasRun.current) {
      return
    }

    hasRun.current = true

    // Intentar obtener el usuario nuevamente
    // Esto es útil en caso de timing issues con la sesión
    const refreshSession = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase.auth.getUser()
        if (!error && data?.user) {
          console.log('🔄 [useRefreshAuth] Session refreshed:', data.user.email)
        }
      } catch (err) {
        console.error('❌ [useRefreshAuth] Error refreshing session:', err)
      }
    }

    // Delay mínimo para permitir que Supabase establezca las cookies
    const timer = setTimeout(refreshSession, 50)
    return () => clearTimeout(timer)
  }, [user, isLoading])
}
