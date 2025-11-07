'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return createClientComponentClient<Database>()
  }

  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>({
      options: {
        persistSession: true,
        storageKey: 'app-session-key',
      }
    })
  }

  return supabaseInstance
}

// Exportar una única instancia para toda la aplicación
export const supabase = getSupabaseClient()