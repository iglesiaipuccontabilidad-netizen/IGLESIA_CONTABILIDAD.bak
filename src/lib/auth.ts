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
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    if (!user) {
      return {
        isAuthenticated: false,
        role: null,
        status: null,
        user: null
      }
    }

    const { data: userData, error: roleError } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', user.id)
      .single() as { data: UsuarioRow | null, error: any }

    if (roleError) throw roleError

    return {
      isAuthenticated: true,
      role: userData?.rol || null,
      status: userData?.estado || null,
      user
    }
  } catch (error) {
    console.error('Error verificando acceso del usuario:', error)
    return {
      isAuthenticated: false,
      role: null,
      status: null,
      user: null
    }
  }
}
