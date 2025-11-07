import { createServerClient } from '@supabase/ssr'
import type { Database } from '../database.types'
import { cookies } from 'next/headers'

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
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // La función set fue llamada desde un componente de servidor
            // Esto se puede ignorar si tienes middleware refrescando las sesiones
            console.debug('Error al configurar cookie:', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // La función remove fue llamada desde un componente de servidor
            // Esto se puede ignorar si tienes middleware refrescando las sesiones
            console.debug('Error al eliminar cookie:', error)
          }
        },
      },
    }
  )
}