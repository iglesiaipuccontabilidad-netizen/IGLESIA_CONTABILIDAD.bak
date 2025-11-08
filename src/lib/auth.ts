import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from './database.types'

type UsuarioRow = Database['public']['Tables']['usuarios']['Row']
type MiembroRow = Database['public']['Tables']['miembros']['Row']

export const getSupabaseServerClient = async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ 
            name, 
            value, 
            ...options,
            // Asegurar que la cookie sea segura
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            httpOnly: true
          })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ 
            name,
            ...options,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            httpOnly: true
          })
        },
      },
    }
  )
}

// Cliente para operaciones del servidor con privilegios elevados
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Solo usar en el servidor
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
)

// Helper para verificar el rol y estado del usuario
export async function verifyUserAccess() {
  const supabase = await getSupabaseServerClient()
  try {
    // 1. Verificar la sesión actual del usuario
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    if (!session) {
      return {
        isAuthenticated: false,
        role: null,
        status: null,
        user: null,
        error: 'No hay sesión activa'
      }
    }

    // 2. Obtener datos del usuario y su rol
    const { data: userData, error: roleError } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', session.user.id)
      .single() as { data: UsuarioRow | null, error: any }

    if (roleError) {
      console.error('Error al obtener rol del usuario:', roleError)
      return {
        isAuthenticated: false,
        role: null,
        status: null,
        user: null,
        error: 'Error al verificar rol del usuario'
      }
    }

    if (!userData) {
      return {
        isAuthenticated: false,
        role: null,
        status: null,
        user: null,
        error: 'Usuario no encontrado en la base de datos'
      }
    }

    // 3. Verificar estado del usuario
    if (userData.estado !== 'activo') {
      // Cerrar la sesión si el usuario no está activo
      await supabase.auth.signOut()
      return {
        isAuthenticated: false,
        role: null,
        status: userData.estado,
        user: null,
        error: 'Usuario no activo'
      }
    }

    // 4. Retornar información completa
    return {
      isAuthenticated: true,
      role: userData.rol,
      status: userData.estado,
      user: session.user,
      error: null
    }

  } catch (error) {
    console.error('Error verificando acceso del usuario:', error)
    return {
      isAuthenticated: false,
      role: null,
      status: null,
      user: null,
      error: 'Error en la verificación de acceso'
    }
  }
}
