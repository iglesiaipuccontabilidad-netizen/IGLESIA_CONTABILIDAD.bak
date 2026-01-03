'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
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

// Almacenar en memoria para evitar queries repetidas
const roleCache = new Map<string, { rol: string | null; timestamp: number }>()
const comitesCache = new Map<string, { comites: any[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [member, setMember] = useState<MemberType | null>(null)
  const [comitesUsuario, setComitesUsuario] = useState<any[]>([])
  
  const mountedRef = useRef(true)
  const supabase = getSupabaseBrowserClient()

  // Cargar el rol del usuario
  const loadUserRole = async (userId: string) => {
    // Verificar caché
    const cached = roleCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.rol
    }

    try {
      // Query simple y rápido solo del rol
      const { data, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error cargando rol:', error)
        return null
      }

      const rol = data?.rol || null
      // Cachear el resultado
      roleCache.set(userId, { rol, timestamp: Date.now() })
      return rol
    } catch (err) {
      console.error('Error en loadUserRole:', err)
      return null
    }
  }

  // Cargar los comités del usuario
  const loadUserComites = async (userId: string) => {
    // Verificar caché
    const cached = comitesCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.comites
    }

    try {
      // Query para obtener los comités del usuario
      const { data, error } = await supabase
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

      const comites = data || []
      // Cachear el resultado
      comitesCache.set(userId, { comites, timestamp: Date.now() })
      return comites
    } catch (err) {
      console.error('Error en loadUserComites:', err)
      return []
    }
  }

  useEffect(() => {
    mountedRef.current = true
    
    async function initializeAuth() {
      try {
        // Obtener sesión actual - esto es rápido y no requiere query
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mountedRef.current) {
          setUser(session.user)
          
          // Cargar el rol de forma asíncrona sin bloquear
          const rol = await loadUserRole(session.user.id)
          
          // Cargar los comités del usuario en paralelo
          const comites = await loadUserComites(session.user.id)
          
          if (mountedRef.current) {
            setMember({
              id: session.user.id,
              email: session.user.email ?? null,
              rol: rol
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

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return

        if (session?.user) {
          setUser(session.user)
          
          // Cargar el rol y comités de forma asíncrona
          const rol = await loadUserRole(session.user.id)
          const comites = await loadUserComites(session.user.id)
          
          if (mountedRef.current) {
            setMember({
              id: session.user.id,
              email: session.user.email ?? null,
              rol: rol
            })
            setComitesUsuario(comites)
          }
        } else {
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
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, isLoading, member, comitesUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
