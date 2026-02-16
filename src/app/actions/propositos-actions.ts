    'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']

export async function getAllPropositos(): Promise<{
  success: boolean;
  data: Array<{ id: string; nombre: string; descripcion: string | null }> | null;
  error: any | null;
}> {
  const supabase = await createClient()

  try {
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('No autenticado')
    }

    const { data: userData } = await supabase
      .from('organizacion_usuarios')
      .select('rol, estado')
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .maybeSingle()

    if (!userData) {
      throw new Error('Usuario no autorizado')
    }

    // Obtener todos los propósitos
    const { data: propositos, error: fetchError } = await supabase
      .from('propositos')
      .select('id, nombre, descripcion')
      .order('nombre', { ascending: true })

    if (fetchError) {
      throw fetchError
    }

    return { success: true, data: propositos, error: null }
  } catch (error) {
    console.error('Error al obtener propósitos:', error)
    return { success: false, data: null, error }
  }
}

export async function updateProposito(
  id: string,
  data: {
    nombre: string
    descripcion?: string | null
    monto_objetivo?: number | null
    fecha_inicio?: string | null
    fecha_fin?: string | null
    estado?: string
  }
): Promise<{
  success: boolean;
  error: any | null;
}> {
  'use server'

  const supabase = await createClient()

  try {
    // Verificar autenticación y permisos
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('No autenticado')
    }

    const { data: userData } = await supabase
      .from('organizacion_usuarios')
      .select('rol, estado')
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .maybeSingle()

    if (!userData) {
      throw new Error('Usuario no autorizado')
    }

    // Solo admin y tesorero pueden editar propósitos
    if (!['admin', 'tesorero'].includes((userData as any).rol)) {
      throw new Error('No tienes permisos para editar propósitos')
    }

    // Verificar que el propósito existe
    const { data: propositoExistente, error: fetchError } = await supabase
      .from('propositos')
      .select('id, nombre')
      .eq('id', id)
      .single()

    if (fetchError || !propositoExistente) {
      throw new Error('Propósito no encontrado')
    }

    // Verificar si el nombre ya existe (excluyendo el actual)
    if (data.nombre !== propositoExistente.nombre) {
      const { data: existingProposito, error: checkError } = await supabase
        .from('propositos')
        .select('id')
        .eq('nombre', data.nombre.trim())
        .neq('id', id)
        .single()

      if (existingProposito) {
        throw new Error('Ya existe un propósito con este nombre')
      }
    }

    // Preparar datos de actualización
    const updateData = {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      monto_objetivo: data.monto_objetivo || null,
      fecha_inicio: data.fecha_inicio || null,
      fecha_fin: data.fecha_fin || null,
      estado: data.estado || 'activo',
      ultima_actualizacion_por: user.id,
      updated_at: new Date().toISOString()
    }

    // Actualizar el propósito
    const { error: updateError } = await supabase
      .from('propositos')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    // Revalidar rutas
    revalidatePath('/dashboard/propositos')
    revalidatePath('/dashboard')

    return { success: true, error: null }
  } catch (error) {
    console.error('Error al actualizar propósito:', error)
    return { success: false, error }
  }
}

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
      .from('organizacion_usuarios')
      .select('rol, estado')
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .maybeSingle()

    if (!userData) {
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