import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from '@/lib/database.types'

const cookieStore = {
  async get(name: string) {
    const cookieList = await cookies()
    return cookieList.get(name)?.value
  },
  async set(name: string, value: string, options: CookieOptions = {}) {
    const cookieList = await cookies()
    const cookieOptions = {
      name,
      value,
      path: options.path || '/',
      maxAge: options.maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: options.sameSite || 'lax'
    }
    try {
      cookieList.set(cookieOptions)
    } catch (error) {
      console.error(`Error setting cookie ${name}:`, error)
    }
  },
  async remove(name: string) {
    const cookieList = await cookies()
    try {
      cookieList.delete(name)
    } catch (error) {
      console.error(`Error removing cookie ${name}:`, error)
    }
  }
}

export async function createServerSupabaseClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          return await cookieStore.get(name) || ''
        },
        set: async (name: string, value: string, options: CookieOptions = {}) => {
          await cookieStore.set(name, value, options)
        },
        remove: async (name: string, options: CookieOptions = {}) => {
          await cookieStore.remove(name)
        }
      }
    }
  )
}

export async function getSession() {
  const supabase = await createServerSupabaseClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function getUserDetails(userId: string) {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: orgUser, error } = await supabase
      .from('organizacion_usuarios')
      .select('usuario_id, organizacion_id, rol, estado, created_at, updated_at')
      .eq('usuario_id', userId)
      .eq('estado', 'activo')
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!orgUser) return null

    // Return a compatible shape
    return {
      id: orgUser.usuario_id,
      rol: orgUser.rol,
      estado: orgUser.estado,
      created_at: orgUser.created_at,
      updated_at: orgUser.updated_at
    }
  } catch (error) {
    console.error('Error getting user details:', error)
    return null
  }
}