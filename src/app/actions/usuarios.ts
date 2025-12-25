'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/database.types'

export async function aprobarUsuario(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Verificar que el usuario actual es admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return { success: false, error: 'No autenticado' }
    }

    // Verificar que el usuario actual tiene rol de admin
    const { data: currentUserData } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || currentUserData.rol !== 'admin' || currentUserData.estado !== 'activo') {
      return { success: false, error: 'No tienes permisos para aprobar usuarios' }
    }

    // Actualizar el usuario
    const { error } = await supabase
      .from('usuarios')
      .update({
        rol: 'usuario',
        estado: 'activo',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error al aprobar usuario:', error)
      return { success: false, error: 'Error al aprobar el usuario' }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al aprobar usuario:', error)
    return { success: false, error: 'Error al aprobar el usuario' }
  }
}

export async function rechazarUsuario(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Verificar que el usuario actual es admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return { success: false, error: 'No autenticado' }
    }

    // Verificar que el usuario actual tiene rol de admin
    const { data: currentUserData } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || currentUserData.rol !== 'admin' || currentUserData.estado !== 'activo') {
      return { success: false, error: 'No tienes permisos para rechazar usuarios' }
    }

    // Actualizar el usuario
    const { error } = await supabase
      .from('usuarios')
      .update({ 
        rol: 'pendiente',
        estado: 'inactivo',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error al rechazar usuario:', error)
      return { success: false, error: 'Error al rechazar el usuario' }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al rechazar usuario:', error)
    return { success: false, error: 'Error al rechazar el usuario' }
  }
}

export async function editarUsuario(
  userId: string, 
  data: { email: string; rol: string; estado: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Verificar que el usuario actual es admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return { success: false, error: 'No autenticado' }
    }

    // Verificar que el usuario actual tiene rol de admin
    const { data: currentUserData } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || currentUserData.rol !== 'admin' || currentUserData.estado !== 'activo') {
      return { success: false, error: 'No tienes permisos para editar usuarios' }
    }

    // Validar datos
    if (!data.email || !data.rol || !data.estado) {
      return { success: false, error: 'Faltan campos requeridos' }
    }

    // Validar formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: 'El formato del correo electrónico no es válido' }
    }

    // Validar rol válido
    const rolesValidos = ['admin', 'tesorero', 'usuario', 'pendiente']
    if (!rolesValidos.includes(data.rol)) {
      return { success: false, error: 'Rol no válido' }
    }

    // Validar estado válido
    const estadosValidos = ['activo', 'inactivo', 'pendiente', 'suspendido']
    if (!estadosValidos.includes(data.estado)) {
      return { success: false, error: 'Estado no válido' }
    }

    // Verificar que el usuario existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !existingUser) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    // Verificar si el email ya está en uso por otro usuario
    if (data.email !== existingUser.email) {
      const { data: emailCheck } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', data.email)
        .neq('id', userId)
        .maybeSingle()

      if (emailCheck) {
        return { success: false, error: 'El correo electrónico ya está en uso' }
      }

      // Actualizar email en auth.users
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { email: data.email }
      )

      if (authError) {
        console.error('Error al actualizar email en auth:', authError)
        return { success: false, error: 'Error al actualizar el email en autenticación' }
      }
    }

    // Actualizar en la tabla usuarios
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        email: data.email,
        rol: data.rol as 'admin' | 'tesorero' | 'usuario' | 'pendiente',
        estado: data.estado as 'activo' | 'inactivo' | 'pendiente' | 'suspendido',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error al actualizar usuario:', updateError)
      return { success: false, error: 'Error al actualizar el usuario: ' + updateError.message }
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
    const supabase = await createClient()

    // Obtener el usuario actual
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return { success: false, error: 'No autenticado' }
    }

    // Verificar que el usuario actual tiene rol de admin
    const { data: currentUserData } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || currentUserData.rol !== 'admin' || currentUserData.estado !== 'activo') {
      return { success: false, error: 'No tienes permisos para eliminar usuarios' }
    }

    // Verificar que no se está eliminando a sí mismo
    if (currentUser.id === userId) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta' }
    }

    // Verificar que el usuario a eliminar existe
    const { data: userToDelete, error: fetchError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !userToDelete) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    // Contar cuántos admins hay
    const { count: adminCount } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'admin')
      .eq('estado', 'activo')

    // Si es el último admin, no permitir eliminación
    if (userToDelete.rol === 'admin' && userToDelete.estado === 'activo' && adminCount === 1) {
      return { success: false, error: 'No se puede eliminar el último administrador activo' }
    }

    if (soft) {
      // Soft delete: solo cambiar estado
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          estado: 'inactivo',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: 'Error al desactivar el usuario' }
      }
    } else {
      // Hard delete: eliminar de auth y BD
      const { error: deleteError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId)

      if (deleteError) {
        return { success: false, error: 'Error al eliminar el usuario de la base de datos' }
      }

      // Eliminar de auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)

      if (authError) {
        console.error('Error al eliminar usuario de auth:', authError)
        // No retornamos error aquí porque ya se eliminó de la BD
      }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return { success: false, error: 'Error al eliminar el usuario' }
  }
}