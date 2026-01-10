import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'
import { cookies } from 'next/headers'

/**
 * Cliente de Supabase para Server Components (solo lectura)
 * Usa este cliente en páginas y componentes de servidor
 */
export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {
          // No hacer nada en Server Components
        },
        remove() {
          // No hacer nada en Server Components
        },
      },
    }
  )
}

/**
 * Cliente de Supabase para Server Actions y Route Handlers
 * Usa este cliente cuando necesites modificar cookies (login, logout, etc.)
 */
export async function createActionClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
}