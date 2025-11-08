'use server'

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

type UsuarioRow = Database['public']['Tables']['usuarios']['Row'];

async function getSupabaseClient() {
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
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
}

export async function getSession() {
  const supabase = await getSupabaseClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export async function signIn(formData: FormData) {
  const supabase = await getSupabaseClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    // 1. Intentar autenticación
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Error de autenticación:', signInError)
      if (signInError.message.includes('Invalid login credentials')) {
        throw new Error('Credenciales inválidas')
      }
      if (signInError.message.includes('Email not confirmed')) {
        throw new Error('Email no confirmado')
      }
      throw signInError
    }

    if (!data?.user) {
      throw new Error('No se pudo autenticar el usuario')
    }

    // 2. Verificar estado y rol del usuario
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', data.user.id)
      .single() as { data: UsuarioRow | null, error: any }

    if (userError) {
      console.error('Error al obtener datos del usuario:', userError)
      await supabase.auth.signOut()
      throw new Error('Error al verificar el estado del usuario')
    }

    if (!userData) {
      await supabase.auth.signOut()
      throw new Error('Usuario no encontrado')
    }

    // 3. Validar estado del usuario
    if (userData.estado !== 'activo') {
      await supabase.auth.signOut()
      throw new Error('Usuario no activo')
    }

    // 4. Todo OK
    return { 
      success: true,
      user: data.user,
      role: userData.rol,
      status: userData.estado
    }

  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Error desconocido al iniciar sesión')
  }
}

export async function signOut() {
  const supabase = await getSupabaseClient()
  await supabase.auth.signOut()
  return { success: true }
}