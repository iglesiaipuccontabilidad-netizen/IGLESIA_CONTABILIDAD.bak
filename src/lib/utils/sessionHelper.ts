import { createClient } from '@/lib/supabase/client'

/**
 * Asegura que existe una sesión válida antes de ejecutar acciones
 * Soluciona el problema de "cold start" en la primera interacción
 */
export async function ensureValidSession() {
  const supabase = createClient()
  
  try {
    // Obtener sesión actual
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Error al obtener sesión:', error)
      throw new Error('Error de autenticación')
    }
    
    if (!session) {
      console.warn('⚠️ No hay sesión activa')
      throw new Error('No hay sesión activa')
    }
    
    // Verificar si el token está próximo a expirar (menos de 5 minutos)
    const expiresAt = session.expires_at
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiresAt ? expiresAt - now : 0
    
    if (timeUntilExpiry < 300) { // 5 minutos
      console.log('🔄 Token próximo a expirar, refrescando...')
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('❌ Error al refrescar sesión:', refreshError)
        throw new Error('Error al refrescar sesión')
      }
      
      return newSession
    }
    
    return session
  } catch (error) {
    console.error('❌ Error en ensureValidSession:', error)
    throw error
  }
}

/**
 * Wrapper para ejecutar funciones asegurando sesión válida
 */
export async function withValidSession<T>(
  action: () => Promise<T>,
  errorMessage = 'Error al ejecutar acción'
): Promise<T> {
  try {
    // Asegurar sesión válida
    await ensureValidSession()
    
    // Ejecutar acción
    return await action()
  } catch (error) {
    console.error('❌ Error en withValidSession:', error)
    throw new Error(errorMessage)
  }
}

/**
 * Retry logic para acciones que pueden fallar temporalmente
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Asegurar sesión válida antes de cada intento
      await ensureValidSession()
      
      // Ejecutar función
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Error desconocido')
      console.warn(`⚠️ Intento ${attempt + 1}/${maxRetries} falló:`, lastError.message)
      
      // Si no es el último intento, esperar antes de reintentar
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  throw lastError || new Error('Todos los intentos fallaron')
}

/**
 * Verificar si el cliente está listo para hacer peticiones
 */
export async function isClientReady(): Promise<boolean> {
  try {
    const session = await ensureValidSession()
    return !!session
  } catch {
    return false
  }
}
