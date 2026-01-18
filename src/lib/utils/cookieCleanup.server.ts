'use server'

import { cookies } from 'next/headers'

/**
 * Limpia todas las cookies de usuario en el servidor
 * SOLO para usar en Server Actions o Route Handlers
 */
export async function clearUserCookiesServer(): Promise<void> {
  const cookieStore = await cookies()
  const COOKIE_PREFIX = 'ipuc_'
  
  const cookiesToClear = ['user_rol', 'user_estado', 'user_id', 'user_email']
  
  cookiesToClear.forEach(name => {
    const cookieName = `${COOKIE_PREFIX}${name}`
    try {
      cookieStore.delete(cookieName)
      console.log(`🗑️ [Server Cookies] Eliminada cookie: ${cookieName}`)
    } catch (err) {
      console.error(`❌ [Server Cookies] Error eliminando ${cookieName}:`, err)
    }
  })
  
  console.log('✅ [Server Cookies] Todas las cookies de usuario limpiadas desde servidor')
}
