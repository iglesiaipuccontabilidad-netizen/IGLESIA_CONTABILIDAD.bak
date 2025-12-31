'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
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
  
  // Crear el cliente fuera del efecto para evitar recreaciones
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    let memberLoaded = false // Bandera para evitar cargas múltiples
    let realtimeSubscription: any = null // Para el listener en tiempo real

    async function loadMemberData(userId: string, retryCount = 0) {
      if (memberLoaded) return
      
      const MAX_RETRIES = 1
      const RETRY_DELAY = 200
      
      try {
        
        // Agregar timeout a la query específica
        const queryPromise = supabase
          .from('usuarios')
          .select('id, email, rol, estado')
          .eq('id', userId)
          .maybeSingle() as Promise<{ data: MemberType | null, error: any }>
        
        const timeoutPromise = new Promise<{ data: null, error: any }>((resolve) => {
          setTimeout(() => {
            resolve({ data: null, error: { message: 'Query timeout after 3s' } })
          }, 3000)
        })
        
        const { data: memberData, error: memberError } = await Promise.race([
          queryPromise,
          timeoutPromise
        ])
        
        if (memberError) {
          console.error('❌ Error al cargar datos del usuario:', memberError)
          
          if (retryCount < MAX_RETRIES && mounted) {
            console.log(`🔄 Reintentando por error en ${RETRY_DELAY}ms...`)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
            return loadMemberData(userId, retryCount + 1)
          }
          
          if (mounted) setMember(null)
        } else if (memberData && typeof memberData === 'object') {
          setMember(memberData)
          memberLoaded = true
          
          // Cargar los comités del usuario
          await loadComitesUsuario(userId)
          
          // Configurar realtime subscription para cambios en este usuario
          setupRealtimeSubscription(userId)
        } else {
          console.warn('⚠️ No se encontraron datos de usuario en la tabla usuarios')
          
          if (retryCount < MAX_RETRIES && mounted) {
            console.log(`🔄 Reintentando en ${RETRY_DELAY}ms...`)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
            return loadMemberData(userId, retryCount + 1)
          }
          
          if (mounted) setMember(null)
        }
      } catch (error) {
        console.error('❌❌❌ EXCEPCIÓN al cargar member data:', {
          error,
          type: typeof error,
          isErrorObject: error instanceof Error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        
        // Intentar de nuevo si hay reintentos disponibles
        if (retryCount < MAX_RETRIES && mounted) {
          console.log(`🔄 Reintentando por excepción en ${RETRY_DELAY}ms...`)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
          return loadMemberData(userId, retryCount + 1)
        }
        
        if (mounted) setMember(null)
      }
    }

    async function loadComitesUsuario(userId: string) {
      
      try {
        // Crear timeout manual con Promise.race
        const queryPromise = supabase
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
        
        const timeoutPromise = new Promise<{ data: null, error: any }>((resolve) => {
          setTimeout(() => {
            resolve({ data: null, error: { message: 'Query timeout after 3s' } })
          }, 3000)
        })
        
        const { data, error } = await Promise.race([
          queryPromise,
          timeoutPromise
        ])
        
        if (error) {
          console.error('❌ Error al cargar comités del usuario:', error)
          setComitesUsuario([])
          return
        }
        
        // Transformar los datos al formato esperado
        const comites: ComiteUsuarioType[] = (data || []).map((cu: any) => ({
          comite_id: cu.comite_id,
          comite_nombre: cu.comites?.nombre || 'Sin nombre',
          rol_en_comite: cu.rol,
          estado: cu.estado
        }))
        
        setComitesUsuario(comites)
      } catch (error) {
        console.error('❌ Excepción al cargar comités:', error)
        setComitesUsuario([])
      }
    }

    // Configurar suscripción en tiempo real para cambios en el usuario
    function setupRealtimeSubscription(userId: string) {
      console.log('🔔 Configurando realtime subscription para usuario:', userId)
      
      realtimeSubscription = supabase
        .channel(`usuarios:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Todos los eventos: INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'usuarios',
            filter: `id=eq.${userId}`
          },
          (payload: any) => {
            console.log('🔄 Cambio detectado en usuario:', payload)
            
            if (payload.new && mounted) {
              console.log('📢 Actualizando member con cambios:', payload.new)
              setMember({
                id: payload.new.id,
                email: payload.new.email,
                rol: payload.new.rol,
                estado: payload.new.estado
              })
            }
          }
        )
        .subscribe((status: string) => {
          console.log('📡 Realtime subscription status:', status)
        })
    }

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('🔄 Auth state changed:', event, session?.user?.email)

        // Solo procesar eventos significativos, ignorar INITIAL_SESSION múltiples
        if (event === 'SIGNED_OUT') {
          console.log('👋 Usuario desconectado')
          setUser(null)
          setMember(null)
          setIsLoading(false)
          memberLoaded = false
          
          // Limpiar suscripción realtime
          if (realtimeSubscription) {
            realtimeSubscription.unsubscribe()
            realtimeSubscription = null
          }
          return
        }

        if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && !memberLoaded)) {
          if (session?.user) {
            console.log('✅ Usuario autenticado:', session.user.email)
            setUser(session.user)
            
            // Cargar datos del usuario y esperar a que termine
            try {
              await loadMemberData(session.user.id)
            } catch (error) {
              console.error('❌ Error al cargar member data:', error)
            } finally {
              // Solo marcar como no loading después de intentar cargar
              setIsLoading(false)
            }
          } else {
            setIsLoading(false)
          }
        }
      }
    )

    // Como fallback, verificar usuario solo si no se ha cargado aún
    const initialize = async () => {
      try {
        if (!mounted || memberLoaded) return
        
        console.log('🔍 Verificando usuario con getUser()...')
        const { data: { user: authUser }, error } = await supabase.auth.getUser()
        
        if (!error && authUser && mounted && !memberLoaded) {
          console.log('✅ Usuario encontrado en getUser():', authUser.email)
          setUser(authUser)
          await loadMemberData(authUser.id)
          setIsLoading(false)
        } else if (!authUser) {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('❌ Error en initialize:', error)
        setIsLoading(false)
      }
    }

    // Solo inicializar si no hay usuario actualmente
    if (!user) {
      initialize()
    }

    // Timeout de seguridad aumentado a 5 segundos
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading && !memberLoaded) {
        console.warn('⚠️ Timeout en inicialización de auth (5s), deteniendo carga')
        setIsLoading(false)
      }
    }, 5000)

    return () => {
      mounted = false
      memberLoaded = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
      
      // Limpiar suscripción realtime
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe()
      }
    }
  }, [supabase])

  const value = {
    user,
    isLoading,
    member,
    comitesUsuario,
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