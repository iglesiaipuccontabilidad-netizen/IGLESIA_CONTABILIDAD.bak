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
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw error
    }

    return usuario
  } catch (error) {
    console.error('Error getting user details:', error)
    return null
  }
}