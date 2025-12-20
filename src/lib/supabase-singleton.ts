'use client'

import { supabase as browserClient } from '@/lib/supabase-client'
import type { Database } from '@/lib/database.types'

export function getSupabaseClient() {
  return browserClient
}

// Exportar una única instancia para toda la aplicación
export const supabase = browserClient