'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { getCookie, saveUserToCookies, validateAuthCookies, clearAuthCookies } from '@/lib/utils/supabaseWithTimeout'

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
  const userRef = useRef<User | null>(null)
  const isLoadingRef = useRef(true)

  // Cargar el rol y estado del usuario con reintentos
  const loadUserRole = useCallback(async (userId: string, retries = 3): Promise<{ rol: string | null; estado: string | null }> => {
    console.log('🔎 [AuthContext] loadUserRole llamado para userId:', userId)
    
    // FASE 1: Intentar leer de cookies primero (RÁPIDO - sin query a BD)
    const rolCookie = getCookie('user_rol')
    const estadoCookie = getCookie('user_estado')
    const userIdCookie = getCookie('user_id')
    
    console.log('🍪 [AuthContext] Cookies encontradas:', { rol: rolCookie, estado: estadoCookie, cookieUserId: userIdCookie })
    
    // CRÍTICO: Solo usar cookies si:
    // 1. Existen rol y estado
    // 2. Existe user_id en cookie
    // 3. user_id cookie === userId de la sesión actual
    if (rolCookie && estadoCookie && userIdCookie) {
      console.log('🔐 [AuthContext] Comparando user_id... Cookie:', userIdCookie, 'vs Session:', userId)
      
      if (userIdCookie === userId) {
        console.log('✅ [AuthContext] Cookies VÁLIDAS - mismo usuario. Rol:', rolCookie)
        return { rol: rolCookie, estado: estadoCookie }
      } else {
        console.error('❌ [AuthContext] COOKIE CONTAMINATION DETECTADA!')
        console.error('   Cookie pertenece a:', userIdCookie.substring(0, 8) + '...')
        console.error('   Sesión actual es:', userId.substring(0, 8) + '...')
        // Limpiar cookies contaminadas INMEDIATAMENTE
        clearAuthCookies()
        console.log('🧹 [AuthContext] Cookies contaminadas eliminadas')
      }
    } else if (rolCookie || estadoCookie) {
      // Hay cookies parciales sin user_id - también limpiar
      console.warn('⚠️ [AuthContext] Cookies parciales sin user_id, limpiando...')
      clearAuthCookies()
    }
    
    console.log('📡 [AuthContext] Consultando rol desde BD para:', userId)
    
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
        
        // FASE 1: Agregar timeout de 10s a la query usando Promise.race
        const queryPromise = supabaseRef.current
          .from('usuarios')
          .select('rol, estado')
          .eq('id', userId)
          .maybeSingle()
        
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout al cargar rol del usuario (intento ${attempt})`)), 10000)
        )
        
        const result = await Promise.race([queryPromise, timeoutPromise])
        const { data, error } = result as any

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

        console.log('✅ [AuthContext] Rol cargado de BD:', data.rol)
        
        // FASE 1: Guardar datos completos en cookies para próxima vez
        if (data.rol && data.estado) {
          // Necesitamos el email del usuario - intentar obtenerlo de la sesión
          const { data: { session } } = await supabaseRef.current.auth.getSession()
          
          saveUserToCookies({
            id: userId,
            email: session?.user?.email || null,
            rol: data.rol,
            estado: data.estado
          }, 604800) // 7 días
        }
        
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

  // Cargar los comités del usuario (con timeout de 10s)
  const loadUserComites = useCallback(async (userId: string) => {
    try {
      const queryPromise = supabaseRef.current
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

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout al cargar comités del usuario')), 10000)
      )

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any
      
      if (error) {
        console.error('Error cargando comités:', error.message)
        return []
      }

      return data || []
    } catch (err) {
      console.warn('⚠️ [AuthContext] loadUserComites falló (timeout o red):', err)
      return []
    }
  }, [])

  // Función para cargar todos los datos del usuario
  const loadUserData = useCallback(async (authUser: User) => {
    console.log('📥 [AuthContext] Cargando datos para:', authUser.email, authUser.id)
    
    setUser(authUser)
    userRef.current = authUser
    
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
        // FASE 1: Timeout de seguridad aumentado a 15 segundos
        timeoutId = setTimeout(() => {
          if (mountedRef.current && isLoadingRef.current) {
            console.warn('⚠️ [AuthContext] Timeout alcanzado después de 15 segundos')
            console.warn('⚠️ [AuthContext] Esto puede indicar problemas de conexión')
            setIsLoading(false)
            isLoadingRef.current = false
          }
        }, 15000)
        
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
          isLoadingRef.current = false
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
            if (session?.user && !userRef.current) {
              console.log('🎯 [AuthContext] Sesión inicial detectada:', session.user.email)
              await loadUserData(session.user)
              if (mountedRef.current) {
                setIsLoading(false)
                isLoadingRef.current = false
              }
            }
            break
            
          case 'SIGNED_IN':
            if (session?.user) {
              // SIGNED_IN se dispara al refocus de pestaña - usar ref para evitar stale closure
              const currentUser = userRef.current
              if (currentUser && currentUser.id === session.user.id) {
                console.log('🔄 [AuthContext] Refocus detectado - usuario ya cargado:', session.user.email)
                // No recargar datos si ya tenemos el mismo usuario
                return
              }
              
              console.log('✨ [AuthContext] Login detectado:', session.user.email)
              setIsLoading(true)
              isLoadingRef.current = true
              
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
                isLoadingRef.current = false
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
            console.log('🚪 [AuthContext] Sesión cerrada - limpiando estado y cookies del cliente')
            clearAuthCookies() // Limpiar cookies en cliente también
            setUser(null)
            userRef.current = null
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
