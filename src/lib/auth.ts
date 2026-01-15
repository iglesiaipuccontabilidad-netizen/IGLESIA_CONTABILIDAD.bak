'use server'

import { createClient } from '@/lib/supabase/server'

export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: userData } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    return userData?.rol || null
  } catch (error) {
    console.error('Error obteniendo rol del usuario:', error)
    return null
  }
}
