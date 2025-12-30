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
  
  // Crear el cliente fuera del efecto para evitar recreaciones
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    let memberLoaded = false // Bandera para evitar cargas múltiples
    let realtimeSubscription: any = null // Para el listener en tiempo real

    async function loadMemberData(userId: string, retryCount = 0) {
      if (memberLoaded) {
        console.log('⚠️ Member ya fue cargado, saltando...')
        return
      }
      
      const MAX_RETRIES = 1
      const RETRY_DELAY = 200 // ms
      
      try {
        console.log('════════════════════════════════════════')
        console.log('🔍 INICIANDO loadMemberData')
        console.log('   User ID:', userId)
        console.log('   Intento:', retryCount + 1, '/', MAX_RETRIES + 1)
        console.log('════════════════════════════════════════')
        
        // Verificar que tenemos un supabase client válido
        if (!supabase) {
          console.error('❌ No hay cliente de Supabase disponible')
          if (mounted) setMember(null)
          return
        }
        
        // Verificar la sesión actual primero
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('🔐 Verificación de sesión:')
        console.log('   Session exists?:', !!session)
        console.log('   Session user ID:', session?.user?.id)
        console.log('   Session error:', sessionError)
        
        if (!session) {
          console.error('❌ No hay sesión activa al intentar cargar member')
          if (retryCount < MAX_RETRIES && mounted) {
            console.log(`🔄 Reintentando por falta de sesión en ${RETRY_DELAY}ms...`)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
            return loadMemberData(userId, retryCount + 1)
          }
          if (mounted) setMember(null)
          return
        }
        
        console.log('🔍 Ejecutando query a tabla usuarios...')
        
        const { data: memberData, error: memberError } = await supabase
          .from('usuarios')
          .select('id, email, rol, estado')
          .eq('id', userId)
          .maybeSingle() as { data: MemberType | null, error: any }
        
        console.log('📦 Respuesta de Supabase:')
        console.log('   Data:', memberData)
        console.log('   Error:', memberError)
        console.log('   Has data?:', !!memberData)
        console.log('   Has error?:', !!memberError)
        
        if (memberError) {
          console.error('❌ Error al cargar datos del usuario:', memberError)
          
          if (retryCount < MAX_RETRIES && mounted) {
            console.log(`🔄 Reintentando por error en ${RETRY_DELAY}ms...`)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
            return loadMemberData(userId, retryCount + 1)
          }
          
          if (mounted) setMember(null)
        } else if (memberData && typeof memberData === 'object') {
          console.log('✅✅✅ DATOS CARGADOS EXITOSAMENTE:')
          console.log('   ID:', memberData.id)
          console.log('   Email:', memberData.email)
          console.log('   Rol:', memberData.rol)
          console.log('   Estado:', memberData.estado)
          
          // ACTUALIZAR ESTADO INMEDIATAMENTE, sin chequear mounted
          // Si el componente se desmonta, React ignorará la actualización de forma segura
          setMember(memberData)
          memberLoaded = true // Marcar como cargado
          console.log('✅ Member actualizado en el estado de React')
          
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
            
            // Cargar datos del usuario
            await loadMemberData(session.user.id)
            setIsLoading(false)
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

    // Timeout de seguridad reducido
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('⚠️ Timeout en inicialización de auth (2s), deteniendo carga')
        setIsLoading(false)
      }
    }, 2000)

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