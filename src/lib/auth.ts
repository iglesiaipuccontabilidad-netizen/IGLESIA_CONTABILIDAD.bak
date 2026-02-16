'use server'

import { createClient } from '@/lib/supabase/server'

export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: orgUser } = await supabase
      .from('organizacion_usuarios')
      .select('rol')
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .maybeSingle()

    return orgUser?.rol || null
  } catch (error) {
    console.error('Error obteniendo rol del usuario:', error)
    return null
  }
}
