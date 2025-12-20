'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

type MemberType = {
  id: string
  email: string | null
  rol: string | null
  estado: Database['public']['Enums']['estado_usuario']
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  member: MemberType | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  member: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [member, setMember] = useState<MemberType | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    async function loadMemberData(userId: string) {
      try {
        const { data: memberData, error: memberError } = await supabase
          .from('usuarios')
          .select('id, email, rol, estado')
          .eq('id', userId)
          .maybeSingle()
        
        if (memberError) {
          console.error('❌ Error al cargar datos del usuario:', memberError)
        } else if (memberData) {
          console.log('✅ Datos del usuario cargados')
          if (mounted) setMember(memberData)
        } else {
          console.warn('⚠️ No se encontraron datos de usuario')
          if (mounted) setMember(null)
        }
      } catch (error) {
        console.error('❌ Error al cargar member data:', error)
        if (mounted) setMember(null)
      }
    }

    // Escuchar cambios de autenticación primero
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('🔄 Auth state changed:', event, session?.user?.email)

        if (event === 'SIGNED_OUT') {
          console.log('👋 Usuario desconectado')
          setUser(null)
          setMember(null)
          setIsLoading(false)
          return
        }

        if (session?.user) {
          console.log('✅ Usuario autenticado en onAuthStateChange:', session.user.email)
          setUser(session.user)
          setIsLoading(false)
          
          // Cargar datos del usuario
          await loadMemberData(session.user.id)
        }
      }
    )

    // Como fallback, también intentar getUser() después de un pequeño delay
    // Esto ayuda en caso de que las cookies no se hayan propagado a tiempo
    const initialize = async () => {
      try {
        // Delay mínimo de 50ms para permitir que las cookies se establezcan
        await new Promise(resolve => setTimeout(resolve, 50))
        
        if (!mounted) return
        
        console.log('🔍 Verificando usuario con getUser()...')
        const { data: { user: authUser }, error } = await supabase.auth.getUser()
        
        console.log('👤 getUser() result:', { user: authUser?.email, error: error?.message })
        
        if (!error && authUser && mounted) {
          console.log('✅ Usuario encontrado en getUser():', authUser.email)
          if (!user) {
            // Solo actualizar si aún no tenemos usuario del listener
            setUser(authUser)
            setIsLoading(false)
            await loadMemberData(authUser.id)
          }
        }
      } catch (error) {
        console.error('❌ Error en getUser():', error)
      }
    }

    // Ejecutar inicialización fallback
    initialize()

    // Timeout de seguridad: si después de 3 segundos aún estamos cargando, detener
    timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('⚠️ Timeout en inicialización de auth (3s), deteniendo carga')
        setIsLoading(false)
      }
    }, 3000)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [supabase, user])

  const value = {
    user,
    isLoading,
    member: member || (user ? { id: user.id, email: user.email || null, rol: null, estado: 'activo' as const } : null),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}