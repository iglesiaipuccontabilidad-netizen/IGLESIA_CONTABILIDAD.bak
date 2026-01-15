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
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  member: null,
  comitesUsuario: [],
  refreshUserData: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [member, setMember] = useState<MemberType | null>(null)
  const [comitesUsuario, setComitesUsuario] = useState<any[]>([])
  
  const mountedRef = useRef(true)
  const supabaseRef = useRef(getSupabaseBrowserClient())

  // Cargar el rol y estado del usuario con reintentos
  const loadUserRole = useCallback(async (userId: string, retries = 3): Promise<{ rol: string | null; estado: string | null }> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📊 [AuthContext] Consultando rol usuario (intento ${attempt}/${retries}):`, userId)
        
        // Verificar que hay sesión válida antes de consultar
        const { data: { session } } = await supabaseRef.current.auth.getSession()
        if (!session) {
          console.warn(`⚠️ [AuthContext] No hay sesión en intento ${attempt}, esperando...`)
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 800 * attempt))
            continue
          }
          return { rol: null, estado: null }
        }
        
        const { data, error } = await supabaseRef.current
          .from('usuarios')
          .select('rol, estado')
          .eq('id', userId)
          .maybeSingle()

        if (error) {
          console.error(`❌ [AuthContext] Error cargando rol (intento ${attempt}):`, error.message, error.code)
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 800 * attempt)) // Espera más larga
            continue
          }
          return { rol: null, estado: null }
        }

        if (!data) {
          console.warn('⚠️ [AuthContext] Usuario no encontrado en tabla usuarios. ID:', userId)
          return { rol: null, estado: null }
        }

        console.log('✅ [AuthContext] Rol cargado:', data.rol)
        return { rol: data.rol || null, estado: data.estado || null }
      } catch (err) {
        console.error(`❌ [AuthContext] Error en loadUserRole (intento ${attempt}):`, err)
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 800 * attempt))
          continue
        }
      }
    }
    return { rol: null, estado: null }
  }, [])

  // Cargar los comités del usuario
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
        console.error('Error cargando comités:', error.message)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Error en loadUserComites:', err)
      return []
    }
  }, [])

  // Función para cargar todos los datos del usuario
  const loadUserData = useCallback(async (authUser: User) => {
    console.log('📥 [AuthContext] Cargando datos para:', authUser.email, authUser.id)
    
    setUser(authUser)
    
    // Esperar un momento para asegurar que la sesión esté completamente sincronizada
    await new Promise(r => setTimeout(r, 300))
    
    // Cargar rol y comités en paralelo
    const [userData, comites] = await Promise.all([
      loadUserRole(authUser.id),
      loadUserComites(authUser.id)
    ])
    
    if (mountedRef.current) {
      const memberData = {
        id: authUser.id,
        email: authUser.email ?? null,
        rol: userData.rol,
        estado: userData.estado
      }
      
      setMember(memberData)
      setComitesUsuario(comites)
      
      console.log('✅ [AuthContext] Datos completos:', {
        email: memberData.email,
        rol: memberData.rol,
        estado: memberData.estado,
        comites: comites.length
      })
      
      // Si el rol es null, intentar cargar de nuevo después de un momento
      if (!userData.rol && authUser.id) {
        console.log('🔄 [AuthContext] Rol null, reintentando en 1 segundo...')
        setTimeout(async () => {
          if (mountedRef.current) {
            const retryData = await loadUserRole(authUser.id, 2)
            if (retryData.rol && mountedRef.current) {
              console.log('✅ [AuthContext] Rol obtenido en reintento:', retryData.rol)
              setMember(prev => prev ? { ...prev, rol: retryData.rol, estado: retryData.estado } : null)
            }
          }
        }, 1000)
      }
    }
  }, [loadUserRole, loadUserComites])

  // Función pública para refrescar datos del usuario
  const refreshUserData = useCallback(async () => {
    if (!user) return
    console.log('🔄 [AuthContext] Refrescando datos del usuario...')
    await loadUserData(user)
  }, [user, loadUserData])

  useEffect(() => {
    mountedRef.current = true
    let timeoutId: NodeJS.Timeout
    
    console.log('🚀 [AuthContext] Iniciando...')
    
    async function initializeAuth() {
      try {
        // Timeout de seguridad - 8 segundos
        timeoutId = setTimeout(() => {
          if (mountedRef.current && isLoading) {
            console.warn('⚠️ [AuthContext] Timeout alcanzado, finalizando carga')
            setIsLoading(false)
          }
        }, 8000)
        
        // Usar getUser() para validar el JWT contra el servidor
        const { data: { user: authUser }, error } = await supabaseRef.current.auth.getUser()
        
        if (error || !authUser) {
          console.log('ℹ️ [AuthContext] Sin sesión activa')
          if (mountedRef.current) {
            setIsLoading(false)
          }
          return
        }
        
        console.log('👤 [AuthContext] Usuario encontrado:', authUser.email)
        
        // Cargar datos del usuario
        await loadUserData(authUser)
        
      } catch (error) {
        console.error('❌ [AuthContext] Error:', error)
      } finally {
        clearTimeout(timeoutId)
        if (mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return

        console.log('🔔 [AuthContext] Evento:', event, session?.user?.email || 'sin usuario')

        switch (event) {
          case 'INITIAL_SESSION':
            // Si hay sesión inicial y aún no tenemos usuario cargado, cargar datos
            if (session?.user && !user) {
              console.log('🎯 [AuthContext] Sesión inicial detectada:', session.user.email)
              await loadUserData(session.user)
              if (mountedRef.current) {
                setIsLoading(false)
              }
            }
            break
            
          case 'SIGNED_IN':
            if (session?.user) {
              console.log('✨ [AuthContext] Login detectado:', session.user.email)
              setIsLoading(true)
              
              // Esperar 500ms para asegurar que cookies y sesión están completamente sincronizadas
              await new Promise(r => setTimeout(r, 500))
              
              // Verificar que la sesión está activa antes de cargar datos
              const { data: { session: verifiedSession } } = await supabaseRef.current.auth.getSession()
              if (!verifiedSession) {
                console.warn('⚠️ [AuthContext] Sesión no verificada después de SIGNED_IN, esperando más...')
                await new Promise(r => setTimeout(r, 1000))
              }
              
              await loadUserData(session.user)
              
              if (mountedRef.current) {
                setIsLoading(false)
              }
            }
            break
            
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            if (session?.user) {
              console.log('🔄 [AuthContext] Actualizando datos...')
              await loadUserData(session.user)
            }
            break
            
          case 'SIGNED_OUT':
            console.log('🚪 [AuthContext] Sesión cerrada')
            setUser(null)
            setMember(null)
            setComitesUsuario([])
            setIsLoading(false)
            break
        }
      }
    )

    return () => {
      console.log('🧹 [AuthContext] Limpiando...')
      clearTimeout(timeoutId)
      mountedRef.current = false
      subscription?.unsubscribe()
    }
  }, [loadUserData])

  return (
    <AuthContext.Provider value={{ user, isLoading, member, comitesUsuario, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
