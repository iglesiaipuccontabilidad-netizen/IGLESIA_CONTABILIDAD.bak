import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Crear cliente de Supabase con SSR para mejor tipado y manejo de sesiones
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)