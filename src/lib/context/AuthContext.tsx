'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

type AuthContextType = {
  user: User | null
  isLoading: boolean
  member: { id: string; email: string; } | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  member: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [member, setMember] = useState<Database['public']['Tables']['usuarios']['Row'] | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadUserAndMember = async () => {
      try {
        // Obtener sesión actual
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Obtener miembro si hay usuario
          const { data: member } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', user.id)
            .single()
          setMember(member)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Cargar datos iniciales
    loadUserAndMember()

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data: member } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setMember(member)
      } else {
        setMember(null)
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, isLoading, member }}>
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