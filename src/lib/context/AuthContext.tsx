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
  const loadingLockRef = useRef(false)  // Prevent concurrent loadUserData calls
  const initDoneRef = useRef(false)  // Track if initializeAuth completed

  // Cargar el rol y estado del usuario con JWT-first strategy
  const loadUserRole = useCallback(async (userId: string, retries = 3): Promise<{ rol: string | null; estado: string | null }> => {
    console.log('🔎 [AuthContext] loadUserRole llamado para userId:', userId)
    
    // ════════════════════════════════════════════════════════════
    // FASE 1: Leer desde JWT app_metadata (Custom Access Token Hook)
    // Esto es instantáneo, sin queries a BD
    // ════════════════════════════════════════════════════════════
    try {
      const { data: { session } } = await supabaseRef.current.auth.getSession()
      if (session?.user?.app_metadata) {
        const appMeta = session.user.app_metadata
        const orgMemberships = appMeta.org_memberships as Array<{ org_id: string; role: string }> | undefined
        
        if (orgMemberships && orgMemberships.length > 0) {
          // Si hay cookie org_id, buscar la membresía de esa org específica
          const preferredOrgId = getCookie('org_id')
          const membership = preferredOrgId
            ? orgMemberships.find(m => m.org_id === preferredOrgId) || orgMemberships[0]
            : orgMemberships[0]
          
          console.log('✅ [AuthContext] Rol desde JWT app_metadata:', membership.role, '| org:', membership.org_id)
          return { rol: membership.role, estado: 'activo' }
        }
      }
    } catch (jwtErr) {
      console.warn('⚠️ [AuthContext] No se pudo leer JWT app_metadata, usando fallback:', jwtErr)
    }
    
    // ════════════════════════════════════════════════════════════
    // FASE 2: Fallback a cookies (rápido, sin query a BD)
    // ════════════════════════════════════════════════════════════
    const rolCookie = getCookie('user_rol')
    const estadoCookie = getCookie('user_estado')
    const userIdCookie = getCookie('user_id')
    
    if (rolCookie && estadoCookie && userIdCookie) {
      if (userIdCookie === userId) {
        console.log('✅ [AuthContext] Rol desde cookies:', rolCookie)
        return { rol: rolCookie, estado: estadoCookie }
      } else {
        clearAuthCookies()
        console.log('🧹 [AuthContext] Cookies contaminadas eliminadas')
      }
    } else if (rolCookie || estadoCookie) {
      clearAuthCookies()
    }
    
    // ════════════════════════════════════════════════════════════
    // FASE 3: Query a BD (fallback lento, con reintentos)
    // Filtra por org_id si está disponible en cookie
    // ════════════════════════════════════════════════════════════
    console.log('📡 [AuthContext] Consultando rol desde BD para:', userId)
    const preferredOrgId = getCookie('org_id')
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data: { session } } = await supabaseRef.current.auth.getSession()
        if (!session) {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 800 * attempt))
            continue
          }
          return { rol: null, estado: null }
        }
        
        // Consultar organizacion_usuarios con filtro por org si disponible
        let query = supabaseRef.current
          .from('organizacion_usuarios')
          .select('rol, estado')
          .eq('usuario_id', userId)
          .eq('estado', 'activo')
        
        if (preferredOrgId) {
          query = query.eq('organizacion_id', preferredOrgId)
        }
        
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout (intento ${attempt})`)), 10000)
        )
        
        const { data, error } = await Promise.race([query.maybeSingle(), timeoutPromise]) as any

        if (error) {
          console.error(`❌ [AuthContext] Error cargando rol (intento ${attempt}):`, error.message)
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 800 * attempt))
            continue
          }
          return { rol: null, estado: null }
        }

        if (!data) {
          console.warn('⚠️ [AuthContext] Sin membresía activa para userId:', userId)
          return { rol: null, estado: null }
        }

        console.log('✅ [AuthContext] Rol cargado de BD:', data.rol)
        
        // Guardar en cookies para próxima vez
        if (data.rol && data.estado) {
          saveUserToCookies({
            id: userId,
            email: session?.user?.email || null,
            rol: data.rol,
            estado: data.estado
          }, 604800)
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
    // Prevent concurrent loadUserData calls
    if (loadingLockRef.current) {
      console.log('🔒 [AuthContext] loadUserData ya en ejecución, saltando...')
      return
    }
    loadingLockRef.current = true
    
    console.log('📥 [AuthContext] Cargando datos para:', authUser.email, authUser.id)
    
    try {
    setUser(authUser)
    userRef.current = authUser
    
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
    } catch (err) {
      console.error('❌ [AuthContext] Error en loadUserData:', err)
    } finally {
      loadingLockRef.current = false
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
    initDoneRef.current = false
    loadingLockRef.current = false
    
    console.log('🚀 [AuthContext] Iniciando...')
    
    // Global safety timeout — NEVER cleared until unmount
    const globalTimeoutId = setTimeout(() => {
      if (mountedRef.current && isLoadingRef.current) {
        console.warn('⚠️ [AuthContext] Safety timeout (12s) — forzando isLoading=false')
        setIsLoading(false)
        isLoadingRef.current = false
      }
    }, 12000)
    
    async function initializeAuth() {
      try {
        // Usar getUser() para validar el JWT contra el servidor
        const { data: { user: authUser }, error } = await supabaseRef.current.auth.getUser()
        
        if (error || !authUser) {
          console.log('ℹ️ [AuthContext] Sin sesión activa')
          return
        }
        
        console.log('👤 [AuthContext] Usuario encontrado:', authUser.email)
        
        // Cargar datos del usuario
        await loadUserData(authUser)
        
      } catch (error) {
        console.error('❌ [AuthContext] Error en initializeAuth:', error)
      } finally {
        initDoneRef.current = true
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

        try {
          switch (event) {
            case 'INITIAL_SESSION':
              // Si initializeAuth ya manejó esto, skip
              if (initDoneRef.current || userRef.current) {
                console.log('ℹ️ [AuthContext] INITIAL_SESSION ignorado — ya inicializado')
                break
              }
              if (session?.user) {
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
                const currentUser = userRef.current
                if (currentUser && currentUser.id === session.user.id) {
                  console.log('🔄 [AuthContext] Refocus detectado — usuario ya cargado')
                  return
                }
                
                console.log('✨ [AuthContext] Nuevo login detectado:', session.user.email)
                setIsLoading(true)
                isLoadingRef.current = true
                
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
              console.log('🚪 [AuthContext] Sesión cerrada')
              clearAuthCookies()
              setUser(null)
              userRef.current = null
              setMember(null)
              setComitesUsuario([])
              setIsLoading(false)
              isLoadingRef.current = false
              break
          }
        } catch (err) {
          console.error('❌ [AuthContext] Error en handler de', event, ':', err)
          // Asegurar que isLoading se resuelva incluso si hay error
          if (mountedRef.current && isLoadingRef.current) {
            setIsLoading(false)
            isLoadingRef.current = false
          }
        }
      }
    )

    return () => {
      console.log('🧹 [AuthContext] Limpiando...')
      clearTimeout(globalTimeoutId)
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
