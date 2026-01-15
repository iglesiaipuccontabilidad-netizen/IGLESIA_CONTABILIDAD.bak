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
    console.log('🚀 [AuthContext] Iniciando useEffect')
    
    // Timeout de seguridad - si después de 10 segundos no carga, forzar a terminar
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        console.warn('⚠️ [AuthContext] Timeout de carga alcanzado, terminando carga...')
        setIsLoading(false)
      }
    }, 10000)
    
    async function initializeAuth() {
      try {
        console.log('🔐 [AuthContext] Iniciando autenticación...')
        setIsLoading(true)
        const { data: { session } } = await supabaseRef.current.auth.getSession()
        console.log('📝 [AuthContext] Sesión obtenida:', session ? '✅ Usuario encontrado' : '❌ Sin sesión')
        
        if (session?.user && mountedRef.current) {
          console.log('👤 [AuthContext] Usuario ID:', session.user.id)
          setUser(session.user)
          
          // Cargar el rol y comités en paralelo
          console.log('📥 [AuthContext] Cargando datos del usuario...')
          const [userData, comites] = await Promise.all([
            loadUserRole(session.user.id),
            loadUserComites(session.user.id)
          ])
          console.log('✅ [AuthContext] Datos cargados - Rol:', userData.rol, 'Comités:', comites.length)
          
          if (mountedRef.current) {
            setMember({
              id: session.user.id,
              email: session.user.email ?? null,
              rol: userData.rol,
              estado: userData.estado
            })
            setComitesUsuario(comites)
            console.log('✅ [AuthContext] Member actualizado')
          }
        } else {
          console.log('⚠️ [AuthContext] No hay sesión o componente desmontado')
        }
      } catch (error) {
        console.error('❌ [AuthContext] Error inicializando auth:', error)
      } finally {
        clearTimeout(timeoutId)
        if (mountedRef.current) {
          console.log('🏁 [AuthContext] Finalizando carga - setIsLoading(false)')
          setIsLoading(false)
        } else {
          console.log('⚠️ [AuthContext] Componente desmontado, no actualizar estado')
        }
      }
    }

    initializeAuth()

    // Escuchar cambios de autenticación - Mejor práctica de Supabase
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return

        console.log('🔄 [AuthContext] Auth state changed:', event)

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
      console.log('🧹 [AuthContext] Limpiando useEffect')
      clearTimeout(timeoutId)
      mountedRef.current = false
      subscription?.unsubscribe()
    }
  }, []) // Array vacío - solo ejecutar una vez al montar

  return (
    <AuthContext.Provider value={{ user, isLoading, member, comitesUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
