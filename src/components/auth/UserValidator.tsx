'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/context/AuthContext'

/**
 * Componente que valida que el usuario en AuthContext coincida con la sesión actual
 * Usa JWT app_metadata en lugar de queries a BD para evitar problemas de RLS/timing
 */
export function UserValidator() {
  const { user, member } = useAuth()
  const lastValidationRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user || !member) return

    // Evitar validaciones duplicadas para el mismo usuario
    const currentUserKey = `${user.id}-${member.rol}-${member.estado}`
    if (lastValidationRef.current === currentUserKey) {
      return
    }
    lastValidationRef.current = currentUserKey

    try {
      // Validar usando JWT app_metadata (sin query a BD)
      const appMetadata = (user as Record<string, unknown>)?.app_metadata as Record<string, unknown> | undefined
      const orgMemberships = appMetadata?.org_memberships as Array<{ org_id: string; role: string }> | undefined

      if (orgMemberships && orgMemberships.length > 0) {
        const jwtRole = orgMemberships[0].role
        if (member.rol !== jwtRole) {
          console.warn('⚠️ [UserValidator] Rol en contexto difiere del JWT:', member.rol, '!=', jwtRole)
        } else {
          console.log('✅ [UserValidator] Usuario validado -', user.email, '| Rol:', member.rol)
        }
      } else {
        console.log('ℹ️ [UserValidator] Sin org_memberships en JWT, validación omitida')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('❌ [UserValidator] Error en validación:', errorMsg)
    }
  }, [user, member])

  return null
}
