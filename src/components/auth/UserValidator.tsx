'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'

/**
 * Componente que valida que el usuario en AuthContext coincida con la sesión actual
 * Útil para detectar problemas de caché o datos desactualizados
 */
export function UserValidator() {
  const { user, member } = useAuth()
  const lastValidationRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user || !member) return

    const validateUser = async () => {
      try {
        // Evitar validaciones duplicadas para el mismo usuario
        const currentUserKey = `${user.id}-${member.rol}-${member.estado}`
        if (lastValidationRef.current === currentUserKey) {
          return
        }
        lastValidationRef.current = currentUserKey

        const supabase = getSupabaseBrowserClient()
        
        // Obtener la sesión actual directamente
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          console.warn('⚠️ [UserValidator] No hay sesión activa pero el contexto tiene usuario')
          return
        }

        // Validar que el usuario en el contexto es el mismo que en la sesión
        if (user.id !== session.user.id) {
          console.error('❌ [UserValidator] DISCREPANCIA DETECTADA!')
          console.error('  - Usuario en contexto:', user.id, user.email)
          console.error('  - Usuario en sesión:', session.user.id, session.user.email)
          console.error('  - NOTA: Considera hacer logout y login nuevamente')
          // NO RECARGAR automáticamente - puede causar bucles infinitos
          return
        }

        // Validar que los datos en BD coinciden (organizacion_usuarios)
        const { data: dbUser, error } = await supabase
          .from('organizacion_usuarios')
          .select('usuario_id, rol, estado')
          .eq('usuario_id', user.id)
          .eq('estado', 'activo')
          .maybeSingle()

        if (error) {
          console.error('❌ [UserValidator] Error al validar usuario en BD:', error)
          return
        }

        if (!dbUser) {
          console.error('❌ [UserValidator] Usuario no encontrado en organizacion_usuarios')
          return
        }

        // Comparar datos
        if (member.rol !== dbUser.rol || member.estado !== dbUser.estado) {
          console.warn('⚠️ [UserValidator] Datos desactualizados detectados:')
          console.warn('  - En contexto:', { rol: member.rol, estado: member.estado })
          console.warn('  - En BD:', { rol: dbUser.rol, estado: dbUser.estado })
          console.warn('  - Los datos se actualizarán en el próximo ciclo')
        } else {
          console.log('✅ [UserValidator] Usuario validado correctamente')
          console.log('  - ID:', user.id)
          console.log('  - Email:', user.email)
          console.log('  - Rol:', member.rol)
        }
      } catch (err) {
        console.error('❌ [UserValidator] Error en validación:', err)
      }
    }

    // Validar al montar
    validateUser()
    
    // No usar intervalo - solo validar una vez por sesión
    // Si hay cambios, el AuthContext los detectará
  }, [user, member])

  return null
}
