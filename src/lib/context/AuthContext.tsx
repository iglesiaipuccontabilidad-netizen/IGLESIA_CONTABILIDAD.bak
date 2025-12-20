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

    async function initialize() {
      try {
        // Usar getUser() en lugar de getSession() para mayor seguridad
        const { data: userData, error } = await supabase.auth.getUser()
        
        if (error) throw error

        if (mounted) {
          if (userData?.user) {
            setUser(userData.user)
            
            // Cargar datos del usuario de forma optimizada
            const { data: memberData, error: memberError } = await supabase
              .from('usuarios')
              .select('id, email, rol, estado')
              .eq('id', userData.user.id)
              .maybeSingle()
            
            if (memberError) {
              console.error('❌ Error al cargar datos del usuario:', memberError)
            } else if (memberData) {
              setMember(memberData)
            } else {
              setMember(null)
            }
          } else {
            setUser(null)
            setMember(null)
          }
        }
      } catch (error) {
        console.error('❌ Error loading user:', error)
        if (mounted) {
          setUser(null)
          setMember(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initialize()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.email)

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setMember(null)
          setIsLoading(false)
          return
        }

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || session?.user) {
          if (session?.user) {
            console.log('User authenticated:', session.user.email)
            setUser(session.user)
            const { data: memberData, error: memberError } = await supabase
              .from('usuarios')
              .select('id, email, rol, estado')
              .eq('id', session.user.id)
              .maybeSingle()
            
            if (memberError) {
              console.error('❌ Error al cargar datos del usuario (onAuthStateChange):', memberError)
            } else if (memberData) {
              console.log('Member data loaded:', memberData)
              setMember(memberData)
            } else {
              setMember(null)
            }
          }
          setIsLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const value = {
    user,
    isLoading,
    member,
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