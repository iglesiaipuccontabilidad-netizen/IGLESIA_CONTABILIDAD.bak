'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'

type MemberType = {
  id: string
  email: string | null
  rol: string | null
  estado: Database['public']['Enums']['estado_usuario']
}

type ComiteUsuarioType = {
  comite_id: string
  comite_nombre: string
  rol_en_comite: string
  estado: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  member: MemberType | null
  comitesUsuario: ComiteUsuarioType[]
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
  const [comitesUsuario, setComitesUsuario] = useState<ComiteUsuarioType[]>([])
  
  // Refs para evitar múltiples llamadas
  const memberLoadedRef = useRef(false)
  const mountedRef = useRef(true)
  const realtimeSubscriptionRef = useRef<any>(null)
  
  // Crear el cliente fuera del efecto para evitar recreaciones
  const supabase = useMemo(() => createClient(), [])

  // Optimización: Usar useCallback para funciones que se pasan como dependencias
  const loadComitesUsuario = useCallback(async (userId: string) => {
    if (!mountedRef.current) return
    
    try {
      const { data, error } = await supabase
        .from('comite_usuarios')
        .select(`
          comite_id,
          rol,
          estado,
          comites:comite_id (
            id,
            nombre
          )
        `)
        .eq('usuario_id', userId)
        .eq('estado', 'activo')
        .abortSignal(AbortSignal.timeout(5000))
      
      if (error) {
        if (error.code !== 'TIMEOUT') {
          console.error('Error al cargar comités:', error.message)
        }
        if (mountedRef.current) setComitesUsuario([])
        return
      }
      
      const comites: ComiteUsuarioType[] = (data || []).map((cu: any) => ({
        comite_id: cu.comite_id,
        comite_nombre: cu.comites?.nombre || 'Sin nombre',
        rol_en_comite: cu.rol,
        estado: cu.estado
      }))
      
      if (mountedRef.current) {
        setComitesUsuario(comites)
      }
    } catch (error) {
      console.error('Excepción al cargar comités:', error instanceof Error ? error.message : 'Error desconocido')
      if (mountedRef.current) setComitesUsuario([])
    }
  }, [supabase])

  const setupRealtimeSubscription = useCallback((userId: string) => {
    if (realtimeSubscriptionRef.current) {
      realtimeSubscriptionRef.current.unsubscribe()
    }
    
    realtimeSubscriptionRef.current = supabase
      .channel(`usuarios:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usuarios',
          filter: `id=eq.${userId}`
        },
        (payload: any) => {
          if (payload.new && mountedRef.current) {
            setMember({
              id: payload.new.id,
              email: payload.new.email,
              rol: payload.new.rol,
              estado: payload.new.estado
            })
          }
        }
      )
      .subscribe()
  }, [supabase])

  const loadMemberData = useCallback(async (userId: string) => {
    if (!userId || !mountedRef.current || memberLoadedRef.current) return
    
    memberLoadedRef.current = true
    
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('usuarios')
        .select('id, email, rol, estado')
        .eq('id', userId)
        .abortSignal(AbortSignal.timeout(8000))
        .maybeSingle()
      
      const isEmptyError = memberError && 
        typeof memberError === 'object' && 
        Object.keys(memberError).length === 0
      
      if (memberData && mountedRef.current) {
        setMember(memberData)
        await loadComitesUsuario(userId)
        setupRealtimeSubscription(userId)
      } else if (memberError && !isEmptyError) {
        if (memberError.code === 'TIMEOUT') {
          console.warn('⚠️ Timeout en consulta de usuarios. Ejecuta la migración de optimización.')
        } else {
          console.error('Error al cargar usuario:', memberError.message)
        }
        if (mountedRef.current) setMember(null)
      }
    } catch (error) {
      console.error('Excepción al cargar datos:', error instanceof Error ? error.message : 'Error desconocido')
      if (mountedRef.current) setMember(null)
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [supabase, loadComitesUsuario, setupRealtimeSubscription])

  useEffect(() => {
    mountedRef.current = true
    
    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setMember(null)
          setComitesUsuario([])
          setIsLoading(false)
          memberLoadedRef.current = false
          
          if (realtimeSubscriptionRef.current) {
            realtimeSubscriptionRef.current.unsubscribe()
            realtimeSubscriptionRef.current = null
          }
          return
        }

        if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && !memberLoadedRef.current)) {
          if (session?.user) {
            setUser(session.user)
            await loadMemberData(session.user.id)
          } else {
            setIsLoading(false)
          }
        }
      }
    )

    // Inicialización: Verificar usuario solo si no se ha cargado
    const initialize = async () => {
      if (!mountedRef.current || memberLoadedRef.current) return
      
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser()
        
        if (!error && authUser && mountedRef.current && !memberLoadedRef.current) {
          setUser(authUser)
          await loadMemberData(authUser.id)
        } else if (!authUser) {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error en inicialización:', error instanceof Error ? error.message : 'Error desconocido')
        if (mountedRef.current) setIsLoading(false)
      }
    }

    if (!user) {
      initialize()
    }

    // Timeout de seguridad
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && isLoading && !memberLoadedRef.current) {
        console.warn('Timeout en inicialización de auth (5s)')
        setIsLoading(false)
      }
    }, 5000)

    return () => {
      mountedRef.current = false
      memberLoadedRef.current = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
      
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current.unsubscribe()
        realtimeSubscriptionRef.current = null
      }
    }
  }, [supabase, user, isLoading, loadMemberData])

  const value = useMemo(() => ({
    user,
    isLoading,
    member,
    comitesUsuario,
  }), [user, isLoading, member, comitesUsuario])

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