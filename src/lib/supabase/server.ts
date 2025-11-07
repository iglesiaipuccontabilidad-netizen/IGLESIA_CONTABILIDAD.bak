import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '../database.types'
import { getCookie, setCookie, removeCookie } from '@/app/actions/cookies'

export async function createClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return getCookie(name)
        },
        async set(name: string, value: string, options: CookieOptions) {
          await setCookie(name, value, options)
        },
        async remove(name: string, options: CookieOptions) {
          await removeCookie(name, options)
        },
      },
    }
  )
}