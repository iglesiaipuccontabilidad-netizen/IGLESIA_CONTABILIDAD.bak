'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'

type MemberType = {
  id: string
  email: string | null
  rol: string | null
  estado?: string | null
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  member: MemberType | null
  comitesUsuario: any[]
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  member: null,
  comitesUsuario: [],
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [member, setMember] = useState<MemberType | null>(null)
  const [comitesUsuario, setComitesUsuario] = useState<any[]>([])
  
  const mountedRef = useRef(true)
  const supabaseRef = useRef(getSupabaseBrowserClient())

  // Cargar el rol y estado del usuario - SIN CACHÉ para siempre obtener datos frescos
  const loadUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabaseRef.current
        .from('usuarios')
        .select('rol, estado')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error cargando rol y estado:', error)
        return { rol: null, estado: null }
      }

      return { rol: data?.rol || null, estado: data?.estado || null }
    } catch (err) {
      console.error('Error en loadUserRole:', err)
      return { rol: null, estado: null }
    }
  }, [])

  // Cargar los comités del usuario - SIN CACHÉ para siempre obtener datos frescos
  const loadUserComites = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabaseRef.current
        .from('comite_usuarios')
        .select(`
          comite_id,
          rol,
          estado,
          comites:comite_id (
            nombre,
            descripcion
          )
        `)
        .eq('usuario_id', userId)
      
      if (error) {
        console.error('Error cargando comités del usuario:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Error en loadUserComites:', err)
      return []
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    
    async function initializeAuth() {
      try {
        setIsLoading(true)
        const { data: { session } } = await supabaseRef.current.auth.getSession()
        
        if (session?.user && mountedRef.current) {
          setUser(session.user)
          
          // Cargar el rol y comités en paralelo
          const [userData, comites] = await Promise.all([
            loadUserRole(session.user.id),
            loadUserComites(session.user.id)
          ])
          
          if (mountedRef.current) {
            setMember({
              id: session.user.id,
              email: session.user.email ?? null,
              rol: userData.rol,
              estado: userData.estado
            })
            setComitesUsuario(comites)
          }
        }
      } catch (error) {
        console.error('Error inicializando auth:', error)
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Escuchar cambios de autenticación - Mejor práctica de Supabase
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return

        console.log('🔄 Auth state changed:', event)

        // Refrescar datos del usuario cuando cambia la sesión
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            setUser(session.user)
            
            // Refetch completo de datos frescos
            const [userData, comites] = await Promise.all([
              loadUserRole(session.user.id),
              loadUserComites(session.user.id)
            ])
            
            if (mountedRef.current) {
              setMember({
                id: session.user.id,
                email: session.user.email ?? null,
                rol: userData.rol,
                estado: userData.estado
              })
              setComitesUsuario(comites)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Limpiar todos los datos al cerrar sesión
          setUser(null)
          setMember(null)
          setComitesUsuario([])
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
    }
  }, [loadUserRole, loadUserComites]) // Solo los callbacks estables

  return (
    <AuthContext.Provider value={{ user, isLoading, member, comitesUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
