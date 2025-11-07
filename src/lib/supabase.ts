import { createClient } from '@supabase/supabase-js'
import { type Database } from './database.types'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cliente para operaciones del servidor con privilegios elevados
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Solo usar en el servidor
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)