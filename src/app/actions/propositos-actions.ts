'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']

export async function deleteProposito(id: string): Promise<{
  success: boolean;
  error: any | null;
}> {
  const supabase = await createClient()

  try {
    // Verificar autenticación y permisos
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('No autenticado')
    }

    const { data: userData } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', user.id)
      .single()

    if (!userData || (userData as any).estado !== 'activo') {
      throw new Error('Usuario no autorizado')
    }

    // Solo admin puede eliminar propósitos
    if ((userData as any).rol !== 'admin') {
      throw new Error('No tienes permisos para eliminar propósitos')
    }

    // Verificar que el propósito existe
    const { data: proposito, error: fetchError } = await supabase
      .from('propositos')
      .select('id, nombre')
      .eq('id', id)
      .single()

    if (fetchError || !proposito) {
      throw new Error('Propósito no encontrado')
    }

    // Verificar si tiene votos asociados
    const { data: votosAsociados, error: votosError } = await supabase
      .from('votos')
      .select('id')
      .eq('proposito_id', id)
      .limit(1)

    if (votosError) {
      throw new Error('Error al verificar votos asociados')
    }

    // Si tiene votos asociados, no permitir eliminación
    if (votosAsociados && votosAsociados.length > 0) {
      throw new Error('No se puede eliminar el propósito porque tiene votos asociados. Elimine primero todos los votos relacionados.')
    }

    // Eliminar el propósito
    const { error: deleteError } = await supabase
      .from('propositos')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    // Revalidar rutas
    revalidatePath('/dashboard/propositos')
    revalidatePath('/dashboard')

    return { success: true, error: null }
  } catch (error) {
    console.error('Error al eliminar propósito:', error)
    return { success: false, error }
  }
}