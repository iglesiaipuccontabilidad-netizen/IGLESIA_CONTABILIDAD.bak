import { createClient } from '@/lib/supabase/server'

/**
 * Asegura que existe una sesión válida antes de ejecutar acciones
 * En Server Actions, la sesión ya se maneja automáticamente por Supabase
 */
export async function ensureValidSession() {
  try {
    const supabase = await createClient()

    // En Server Actions, intentar obtener la sesión
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      console.warn('⚠️ No hay sesión activa en el servidor (continuando)')
      // No lanzar error, permitir que continue
      return null
    }

    // Verificar si el token está próximo a expirar (menos de 5 minutos)
    const expiresAt = session.expires_at
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiresAt ? expiresAt - now : 0

    if (timeUntilExpiry < 300 && timeUntilExpiry > 0) { // 5 minutos
      console.log('🔄 Token próximo a expirar, intentando refrescar...')

      try {
        const { data: { session: newSession } } = await supabase.auth.refreshSession()

        if (newSession) {
          console.log('✅ Sesión refrescada exitosamente')
          return newSession
        }
      } catch (refreshError) {
        console.warn('⚠️ Error al refrescar sesión (continuando):', refreshError)
        return session // Usar sesión original
      }
    }

    return session
  } catch (error) {
    console.warn('⚠️ Error en ensureValidSession (continuando):', error)
    // No lanzar error, permitir que continue
    return null
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
 * FASE 2: Ahora incluye timeout integrado
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 1000,
  timeoutMs = 15000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Intentar asegurar sesión válida, pero no fallar si no hay sesión
      await ensureValidSession()

      // FASE 2: Ejecutar función con timeout
      const result = await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout de operación después de ${timeoutMs}ms (intento ${attempt + 1})`)),
            timeoutMs
          )
        )
      ])
      
      return result
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
