'use server'

import { createClient } from '@/lib/supabase/server'
import { MiembroFormData } from '@/types/miembros'
import { revalidatePath } from 'next/cache'
import { withRetry } from '@/lib/utils/sessionHelper'
import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']
type TableName = keyof Tables
type SupabaseTable<T extends TableName> = Tables[T]

type MiembroRow = SupabaseTable<'miembros'>['Row']
type MiembroInsert = SupabaseTable<'miembros'>['Insert']
type MiembroUpdate = SupabaseTable<'miembros'>['Update']

export async function createMiembro(formData: MiembroFormData) {
  return withRetry(async () => {
    try {
      const supabase = await createClient()
      
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

      // Solo admin y tesorero pueden crear miembros
      if (!['admin', 'tesorero'].includes((userData as any).rol)) {
        throw new Error('No tienes permisos para crear miembros')
      }
      
      const allowedRoles = ['miembro', 'admin', 'tesorero']
      if (formData.rol && !allowedRoles.includes(formData.rol)) {
        console.error('Rol inválido en createMiembro:', formData.rol)
        throw new Error(`Rol inválido: ${String(formData.rol)}`)
      }

      const nuevoMiembro: MiembroInsert = {
        nombres: formData.nombres,
        apellidos: formData.apellidos, 
        telefono: formData.telefono || null,
        email: formData.email || null,
        direccion: formData.direccion || null,
        fecha_ingreso: formData.fecha_ingreso,
        estado: formData.estado || 'activo',
        rol: formData.rol || 'miembro'
      }

      const { data, error } = await supabase
        .from('miembros')
        .insert(nuevoMiembro as any)
        .select()
        .single()

      if (error) {
        console.error('Error al crear miembro:', error, 'payload:', nuevoMiembro)
        throw error
      }

      revalidatePath('/dashboard/miembros')
      return data as MiembroRow

    } catch (error) {
      console.error('Error en createMiembro:', error)
      throw error
    }
  }, 3, 1000)
}

export async function updateMiembro(id: string, formData: MiembroFormData) {
  return withRetry(async () => {
    try {
      const supabase = await createClient()

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

      // Solo admin y tesorero pueden editar miembros
      if (!['admin', 'tesorero'].includes((userData as any).rol)) {
        throw new Error('No tienes permisos para editar miembros')
      }

      const allowedRoles = ['miembro', 'admin', 'tesorero']
      if (formData.rol && !allowedRoles.includes(formData.rol)) {
        console.error('Rol inválido en updateMiembro:', formData.rol)
        throw new Error(`Rol inválido: ${String(formData.rol)}`)
      }

      const actualizacion: MiembroUpdate = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono || null,
        email: formData.email || null,
        direccion: formData.direccion || null,
        fecha_ingreso: formData.fecha_ingreso,
        estado: formData.estado || 'activo',
        rol: formData.rol || 'miembro'
      }

      const { data, error } = await supabase
        .from('miembros')
        .update(actualizacion as never)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error al actualizar miembro:', error, 'payload:', actualizacion, 'id:', id)
        throw error
      }

      revalidatePath('/dashboard/miembros')
      return data as MiembroRow

    } catch (error) {
      console.error('Error en updateMiembro:', error)
      throw error
    }
  }, 3, 1000)
}

export async function eliminarMiembro(id: string) {
  try {
    const supabase = await createClient()

    // Verificar autenticación y permisos
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'No autenticado' }
    }

    const { data: userData } = await supabase
      .from('organizacion_usuarios')
      .select('rol, estado')
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .maybeSingle()

    if (!userData) {
      return { error: 'Usuario no autorizado' }
    }

    // Solo admin puede eliminar miembros
    if ((userData as any).rol !== 'admin') {
      return { error: 'No tienes permisos para eliminar miembros' }
    }

    // Verificar si el miembro tiene votos o pagos asociados
    const { data: votos, error: votosError } = await supabase
      .from('votos')
      .select('id')
      .eq('miembro_id', id)
      .limit(1)

    if (votosError) {
      throw new Error('Error al verificar votos del miembro')
    }

    if (votos && votos.length > 0) {
      return { error: 'No se puede eliminar el miembro porque tiene votos registrados' }
    }

    // Realizar la eliminación
    const { error: deleteError } = await supabase
      .from('miembros')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error al eliminar miembro:', deleteError)
      throw deleteError
    }

    revalidatePath('/dashboard/miembros')
    return { success: true }

  } catch (error: any) {
    console.error('Error en eliminarMiembro:', error)
    return { error: error.message }
  }
}

export async function getMiembros() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('miembros')
      .select()
      .order('apellidos', { ascending: true })

    if (error) {
      console.error('Error al obtener miembros:', error)
      throw error
    }

    return data as MiembroRow[]

  } catch (error) {
    console.error('Error en getMiembros:', error)
    throw error
  }
}

type MiembroConVotos = MiembroRow & {
  votos: Array<{
    id: string
    estado: SupabaseTable<'votos'>['Row']['estado']
    proposito: string
    monto_total: number
    recaudado: number
  }>
}

export async function getMiembroById(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('miembros')
      .select(`*, 
        votos (
          id,
          estado,
          proposito,
          monto_total,
          recaudado
        )`)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error al obtener miembro:', error)
      throw error
    }

    return data as unknown as MiembroConVotos

  } catch (error) {
    console.error('Error en getMiembroById:', error)
    throw error
  }
}


