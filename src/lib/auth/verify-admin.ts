/**
 * Utilidades para verificación de admin y cliente Supabase admin
 * Basado en mejores prácticas de Supabase
 * @see https://supabase.com/docs/guides/auth/managing-user-data
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { VerifyAdminResult, UserVerificationData } from '@/types/usuarios'

/**
 * Verifica si el usuario actual es admin activo
 * Utiliza auth.getUser() para validar contra el servidor (más seguro que getSession)
 */
export async function verifyAdmin(): Promise<VerifyAdminResult> {
  try {
    const supabase = await createClient()
    
    // Usar getUser() en lugar de getSession() para mayor seguridad
    // getUser() valida el token contra el servidor de auth
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !currentUser) {
      return { 
        isAdmin: false, 
        currentUserId: null, 
        error: 'No autenticado' 
      }
    }

    // Obtener rol y estado del usuario desde la tabla usuarios
    const { data: userData, error: dbError } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', currentUser.id)
      .single<UserVerificationData>()

    if (dbError) {
      console.error('Error al obtener datos de usuario:', dbError)
      return { 
        isAdmin: false, 
        currentUserId: currentUser.id, 
        error: 'Error al verificar permisos: ' + dbError.message 
      }
    }

    if (!userData) {
      return { 
        isAdmin: false, 
        currentUserId: currentUser.id, 
        error: 'Usuario no encontrado en base de datos' 
      }
    }

    const isAdmin = userData.rol === 'admin' && userData.estado === 'activo'
    
    return { 
      isAdmin, 
      currentUserId: currentUser.id,
      userData
    }
  } catch (error) {
    console.error('Error verificando admin:', error)
    return { 
      isAdmin: false, 
      currentUserId: null, 
      error: 'Error de verificación interno' 
    }
  }
}

/**
 * Verifica si el usuario actual tiene un rol específico
 */
export async function verifyRole(allowedRoles: string[]): Promise<VerifyAdminResult> {
  try {
    const supabase = await createClient()
    
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !currentUser) {
      return { 
        isAdmin: false, 
        currentUserId: null, 
        error: 'No autenticado' 
      }
    }

    const { data: userData, error: dbError } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', currentUser.id)
      .single<UserVerificationData>()

    if (dbError || !userData) {
      return { 
        isAdmin: false, 
        currentUserId: currentUser.id, 
        error: 'Usuario no encontrado en base de datos' 
      }
    }

    const hasRole = userData.estado === 'activo' && allowedRoles.includes(userData.rol)
    
    return { 
      isAdmin: hasRole, 
      currentUserId: currentUser.id,
      userData
    }
  } catch (error) {
    console.error('Error verificando rol:', error)
    return { 
      isAdmin: false, 
      currentUserId: null, 
      error: 'Error de verificación interno' 
    }
  }
}

/**
 * Obtiene el cliente admin de Supabase (con service_role)
 * IMPORTANTE: Solo usar en el servidor, nunca exponer al cliente
 * 
 * El service_role key bypassa RLS y tiene acceso completo
 * @see https://supabase.com/docs/guides/api/api-keys
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan variables de entorno para cliente admin de Supabase')
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Valida que el usuario actual puede realizar operaciones admin
 * y retorna tanto el cliente normal como el admin
 */
export async function getAdminContext() {
  const verification = await verifyAdmin()
  
  if (!verification.isAdmin) {
    return {
      success: false as const,
      error: verification.error || 'No tienes permisos de administrador'
    }
  }

  const supabase = await createClient()
  const supabaseAdmin = getSupabaseAdmin()

  return {
    success: true as const,
    supabase,
    supabaseAdmin,
    currentUserId: verification.currentUserId!
  }
}
