/**
 * Helper para agregar timeout a queries de Supabase
 * Previene cargas infinitas cuando las queries tardan demasiado
 */

/**
 * Ejecuta una query de Supabase con timeout
 * @param queryPromise - La promesa de la query de Supabase (o builder con .then)
 * @param timeoutMs - Tiempo de espera en milisegundos (default: 10000ms = 10s)
 * @param errorMessage - Mensaje de error personalizado
 * @returns Resultado de la query o lanza error por timeout
 */
export async function queryWithTimeout<T>(
  queryPromise: Promise<T> | PromiseLike<T>,
  timeoutMs: number = 10000,
  errorMessage: string = 'La consulta tardó demasiado tiempo'
): Promise<T> {
  return Promise.race([
    Promise.resolve(queryPromise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}

/**
 * Sistema mejorado de cookies para autenticación
 */

// Prefijo para todas las cookies de autenticación
const COOKIE_PREFIX = '__auth_'
const COOKIE_VERSION = 'v1'

interface CookieOptions {
  maxAge?: number // Segundos
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

/**
 * Genera un hash simple para validar integridad de cookies
 */
function generateHash(value: string): string {
  // Hash simple para validar que no se modificó la cookie
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convertir a 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Codifica un valor con versión y hash para validación
 */
export function encodeValue(value: string): string {
  const hash = generateHash(value)
  return `${COOKIE_VERSION}:${value}:${hash}`
}

/**
 * Decodifica y valida un valor de cookie
 */
function decodeValue(encodedValue: string): string | null {
  try {
    const parts = encodedValue.split(':')
    if (parts.length !== 3) return null
    
    const [version, value, hash] = parts
    
    // Verificar versión
    if (version !== COOKIE_VERSION) {
      console.warn('⚠️ [Cookies] Versión de cookie obsoleta')
      return null
    }
    
    // Verificar integridad
    const expectedHash = generateHash(value)
    if (hash !== expectedHash) {
      console.error('❌ [Cookies] Cookie manipulada - hash no coincide')
      return null
    }
    
    return value
  } catch (err) {
    console.error('❌ [Cookies] Error al decodificar cookie:', err)
    return null
  }
}

/**
 * Helper para obtener cookies del navegador con validación
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const cookieName = `${COOKIE_PREFIX}${name}`
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${cookieName}=`)
  
  if (parts.length === 2) {
    const encodedValue = parts.pop()?.split(';').shift()
    if (encodedValue) {
      const decodedValue = decodeValue(encodedValue)
      if (decodedValue) {
        console.log(`✅ [Cookies] Cookie leída: ${name}`)
        return decodedValue
      } else {
        console.warn(`⚠️ [Cookies] Cookie inválida o corrupta: ${name}`)
        // Limpiar cookie corrupta
        deleteCookie(name)
        return null
      }
    }
  }
  
  return null
}

/**
 * Helper para establecer cookies en el navegador con validación
 */
export function setCookie(name: string, value: string, maxAge: number = 604800, options?: CookieOptions): boolean {
  if (typeof document === 'undefined') return false
  
  try {
    const cookieName = `${COOKIE_PREFIX}${name}`
    const encodedValue = encodeValue(value)
    
    const defaults: CookieOptions = {
      maxAge,
      path: '/',
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      ...options
    }
    
    let cookieString = `${cookieName}=${encodedValue}`
    cookieString += `; path=${defaults.path}`
    cookieString += `; max-age=${defaults.maxAge}`
    cookieString += `; SameSite=${defaults.sameSite}`
    
    if (defaults.secure) {
      cookieString += '; Secure'
    }
    
    if (defaults.domain) {
      cookieString += `; domain=${defaults.domain}`
    }
    
    document.cookie = cookieString
    
    // Verificar que se guardó correctamente
    const verificacion = getCookie(name)
    if (verificacion === value) {
      console.log(`✅ [Cookies] Cookie guardada exitosamente: ${name}`)
      return true
    } else {
      console.error(`❌ [Cookies] Error al guardar cookie: ${name}`)
      return false
    }
  } catch (err) {
    console.error(`❌ [Cookies] Error al establecer cookie ${name}:`, err)
    return false
  }
}

/**
 * Helper para eliminar cookies
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  
  const cookieName = `${COOKIE_PREFIX}${name}`
  document.cookie = `${cookieName}=; path=/; max-age=0`
  console.log(`🗑️ [Cookies] Cookie eliminada: ${name}`)
}

/**
 * Limpiar todas las cookies de autenticación
 */
export function clearAuthCookies(): void {
  if (typeof document === 'undefined') return
  
  const authCookieNames = ['user_rol', 'user_estado', 'user_id', 'user_email']
  
  authCookieNames.forEach(name => {
    deleteCookie(name)
  })
  
  console.log('🧹 [Cookies] Todas las cookies de autenticación eliminadas')
}

/**
 * Obtener todas las cookies de autenticación
 */
export function getAllAuthCookies(): Record<string, string | null> {
  return {
    rol: getCookie('user_rol'),
    estado: getCookie('user_estado'),
    id: getCookie('user_id'),
    email: getCookie('user_email')
  }
}

/**
 * Validar que las cookies de autenticación son consistentes y pertenecen al usuario actual
 * @param currentUserId - ID del usuario de la sesión actual para validar contra cookies
 * @returns true si las cookies son válidas y pertenecen al usuario actual
 */
export function validateAuthCookies(currentUserId?: string): boolean {
  const cookies = getAllAuthCookies()
  
  // Al menos rol y estado deben existir
  if (!cookies.rol || !cookies.estado) {
    console.warn('⚠️ [Cookies] Cookies de autenticación incompletas')
    return false
  }
  
  // Si se proporciona un userId, verificar que coincida con la cookie
  if (currentUserId && cookies.id) {
    if (cookies.id !== currentUserId) {
      console.error('❌ [Cookies] COOKIE CONTAMINATION DETECTED!')
      console.error(`   Cookie user_id: ${cookies.id}`)
      console.error(`   Session userId: ${currentUserId}`)
      console.log('🧹 [Cookies] Auto-limpiando cookies contaminadas...')
      clearAuthCookies()
      return false
    }
  }
  
  console.log('✅ [Cookies] Cookies de autenticación válidas para usuario:', currentUserId || 'sin validar')
  return true
}

/**
 * Guardar datos completos de usuario en cookies
 */
export function saveUserToCookies(user: {
  id: string
  email: string | null
  rol: string
  estado: string
}, maxAge: number = 604800): boolean {
  try {
    const results = [
      setCookie('user_id', user.id, maxAge),
      setCookie('user_rol', user.rol, maxAge),
      setCookie('user_estado', user.estado, maxAge)
    ]
    
    if (user.email) {
      results.push(setCookie('user_email', user.email, maxAge))
    }
    
    const allSuccess = results.every(r => r === true)
    
    if (allSuccess) {
      console.log('✅ [Cookies] Usuario completo guardado en cookies')
    } else {
      console.error('❌ [Cookies] Error al guardar algunos datos del usuario')
    }
    
    return allSuccess
  } catch (err) {
    console.error('❌ [Cookies] Error al guardar usuario:', err)
    return false
  }
}
