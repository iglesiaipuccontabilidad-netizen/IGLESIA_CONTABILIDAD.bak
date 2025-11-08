import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let supabaseInstance: SupabaseClient<Database> | null = null

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: { 'x-app-name': 'ipuc-contabilidad' },
      },
    }
  )

  return supabaseInstance
})()