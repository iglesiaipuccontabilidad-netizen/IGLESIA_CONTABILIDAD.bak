'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/database.types'

export async function aprobarUsuario(userId: string): Promise<{ success: boolean }> {
  try {
    const client = await createClient()
    const { error } = await (client as any)
      .from('usuarios')
      .update({
        rol: 'usuario',
        estado: 'activo'
      })
      .eq('id', userId)

    if (error) {
      console.error('Error al aprobar usuario:', error)
      return { success: false }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al aprobar usuario:', error)
    return { success: false }
  }
}

export async function rechazarUsuario(userId: string): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('usuarios')
      .update({ 
        rol: 'pendiente',
        estado: 'inactivo' 
      })
      .eq('id', userId)

    if (error) {
      console.error('Error al rechazar usuario:', error)
      return { success: false }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al rechazar usuario:', error)
    return { success: false }
  }
}

export async function editarUsuario(
  userId: string, 
  data: { email: string; rol: string; estado: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/admin/usuarios/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al editar usuario:', error)
    return { success: false, error: 'Error al editar el usuario' }
  }
}

export async function eliminarUsuario(
  userId: string, 
  soft: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/admin/usuarios/${userId}?soft=${soft}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return { success: false, error: 'Error al eliminar el usuario' }
  }
}