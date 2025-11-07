import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { cookies } from 'next/headers'

export type UserRole = 'admin' | 'usuario' | 'pendiente' | 'tesorero'
export type UserStatus = 'activo' | 'inactivo' | 'pendiente'
export type AuthorizedRole = Extract<UserRole, 'admin' | 'tesorero'>

export type AuthUser = {
  id: string
  email: string
  rol: UserRole
  estado: UserStatus
}

/**
 * Códigos de error específicos para autenticación
 */
export const AuthErrorCodes = {
  NOT_AUTHENTICATED: 'AUTH_NOT_AUTHENTICATED',
  DATABASE_ERROR: 'AUTH_DATABASE_ERROR',
  USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  USER_INACTIVE: 'AUTH_USER_INACTIVE',
  UNAUTHORIZED_ROLE: 'AUTH_UNAUTHORIZED_ROLE',
  UNKNOWN_ERROR: 'AUTH_UNKNOWN_ERROR'
} as const

/**
 * Verifica la autenticación del usuario y sus permisos
 * @param requiredRoles Roles permitidos para acceder
 * @returns Usuario autenticado con sus permisos o redirecciona
 */
export async function verifyAuth(
  requiredRoles: AuthorizedRole[] = ['admin', 'tesorero'],
  redirectTo?: string
) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()

    // Verificar la autenticación usando auth.getSession() ya que estamos en el servidor
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      console.error('Error de autenticación:', {
        error: authError,
        code: AuthErrorCodes.NOT_AUTHENTICATED
      })
      const destination = redirectTo ? 
        `/login?redirectTo=${encodeURIComponent(redirectTo)}` : 
        '/login'
      redirect(destination)
    }

    const user = session.user

    // Obtener información adicional del usuario de la tabla usuarios
    let { data: userData, error: dbError } = await supabase
      .from('usuarios')
      .select(`
        rol,
        estado
      `)
      .eq('id', user.id)
      .single() as {
        data: Pick<AuthUser, 'rol' | 'estado'> | null,
        error: any
      }

    if (dbError) {
      // Si el error es específicamente por columna faltante (código 42703)
      // asignar valores temporales mientras se aplica la migración
      if (dbError.code === '42703') {
        console.warn('Columnas rol/estado no encontradas, usando valores por defecto temporalmente:', {
          error: dbError,
          userId: user.id,
          details: dbError.details
        })
        userData = {
          rol: 'admin' as const, // Temporalmente dar acceso admin
          estado: 'activo' as const
        }
      } else {
        console.error('Error al obtener datos del usuario:', {
          error: dbError,
          userId: user.id,
          details: dbError.details,
          code: AuthErrorCodes.DATABASE_ERROR
        })
        redirect('/login?error=database-error')
      }
    }

    if (!userData) {
      console.warn('Usuario no encontrado en la base de datos:', {
        userId: user.id,
        code: AuthErrorCodes.USER_NOT_FOUND
      })
      redirect('/login?error=user-not-found')
    }

    if (userData.estado !== 'activo') {
      console.warn('Usuario inactivo:', {
        userId: user.id,
        estado: userData.estado,
        code: AuthErrorCodes.USER_INACTIVE
      })
      redirect('/dashboard?error=usuario-inactivo')
    }

    if (!requiredRoles.includes(userData.rol as AuthorizedRole)) {
      console.warn('Acceso denegado - Rol no permitido:', {
        userId: user.id,
        rolActual: userData.rol,
        rolesPermitidos: requiredRoles,
        code: AuthErrorCodes.UNAUTHORIZED_ROLE
      })
      redirect('/dashboard?error=acceso-denegado')
    }

    return {
      id: user.id,
      email: user.email!,
      rol: userData.rol,
      estado: userData.estado
    } as AuthUser
  } catch (error) {
    console.error('Error en verificación de autenticación:', {
      error,
      code: AuthErrorCodes.UNKNOWN_ERROR
    })
    redirect('/login?error=auth-error')
  }
}