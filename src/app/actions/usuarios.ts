/**
 * Server Actions para gestión de usuarios
 * Basado en mejores prácticas de Supabase
 * 
 * - Usa getUser() en lugar de getSession() para mayor seguridad
 * - Cliente admin con service_role para operaciones privilegiadas
 * - Tipos fuertes sin uso de 'as any'
 * - Helper centralizado para verificación de admin
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifyAdmin, getSupabaseAdmin, getAdminContext } from '@/lib/auth/verify-admin'
import { 
  type ActionResult, 
  type UserRole, 
  type UserStatus,
  type EditarUsuarioData,
  ROLES_VALIDOS, 
  ESTADOS_VALIDOS,
  isValidRole,
  isValidStatus,
  isValidEmail
} from '@/types/usuarios'

/**
 * Aprueba un usuario pendiente, cambiando su rol a 'usuario' y estado a 'activo'
 */
export async function aprobarUsuario(userId: string): Promise<ActionResult> {
  try {
    const context = await getAdminContext()
    
    if (!context.success) {
      return { success: false, error: context.error }
    }

    const { supabase } = context

    const { error } = await supabase
      .from('usuarios')
      .update({
        rol: 'usuario' satisfies UserRole,
        estado: 'activo' satisfies UserStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error al aprobar usuario:', error)
      return { success: false, error: 'Error al aprobar el usuario: ' + error.message }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al aprobar usuario:', error)
    return { success: false, error: 'Error al aprobar el usuario' }
  }
}

/**
 * Rechaza un usuario pendiente, cambiando su estado a 'inactivo'
 */
export async function rechazarUsuario(userId: string): Promise<ActionResult> {
  try {
    const context = await getAdminContext()
    
    if (!context.success) {
      return { success: false, error: context.error }
    }

    const { supabase } = context

    const { error } = await supabase
      .from('usuarios')
      .update({ 
        rol: 'pendiente' satisfies UserRole,
        estado: 'inactivo' satisfies UserStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error al rechazar usuario:', error)
      return { success: false, error: 'Error al rechazar el usuario: ' + error.message }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al rechazar usuario:', error)
    return { success: false, error: 'Error al rechazar el usuario' }
  }
}

/**
 * Edita los datos de un usuario existente
 */
export async function editarUsuario(
  userId: string, 
  data: EditarUsuarioData
): Promise<ActionResult> {
  try {
    const context = await getAdminContext()
    
    if (!context.success) {
      return { success: false, error: context.error }
    }

    const { supabase, supabaseAdmin } = context

    // Validaciones
    if (!data.email || !data.rol || !data.estado) {
      return { success: false, error: 'Faltan campos requeridos' }
    }

    if (!isValidEmail(data.email)) {
      return { success: false, error: 'El formato del correo electrónico no es válido' }
    }

    if (!isValidRole(data.rol)) {
      return { success: false, error: `Rol no válido. Roles permitidos: ${ROLES_VALIDOS.join(', ')}` }
    }

    if (!isValidStatus(data.estado)) {
      return { success: false, error: `Estado no válido. Estados permitidos: ${ESTADOS_VALIDOS.join(', ')}` }
    }

    // Verificar que el usuario existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, email')
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

      // Actualizar email en auth.users usando cliente admin (requiere service_role)
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email: data.email }
      )

      if (authError) {
        console.error('Error al actualizar email en auth:', authError)
        return { success: false, error: 'Error al actualizar el email en autenticación: ' + authError.message }
      }
    }

    // Actualizar en la tabla usuarios
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        email: data.email,
        rol: data.rol,
        estado: data.estado,
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

/**
 * Elimina un usuario (soft delete por defecto)
 * @param userId - ID del usuario a eliminar
 * @param soft - Si es true, solo cambia el estado a 'inactivo'. Si es false, elimina completamente.
 */
export async function eliminarUsuario(
  userId: string, 
  soft: boolean = true
): Promise<ActionResult> {
  try {
    const context = await getAdminContext()
    
    if (!context.success) {
      return { success: false, error: context.error }
    }

    const { supabase, supabaseAdmin, currentUserId } = context

    // Verificar que no se está eliminando a sí mismo
    if (currentUserId === userId) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta' }
    }

    // Verificar que el usuario existe
    const { data: userToDelete, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, rol, estado')
      .eq('id', userId)
      .single()

    if (fetchError || !userToDelete) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    // Contar cuántos admins activos hay
    const { count: adminCount } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'admin')
      .eq('estado', 'activo')

    // Si es el último admin activo, no permitir eliminación
    if (userToDelete.rol === 'admin' && userToDelete.estado === 'activo' && adminCount === 1) {
      return { success: false, error: 'No se puede eliminar el último administrador activo' }
    }

    if (soft) {
      // Soft delete: solo cambiar estado a inactivo
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          estado: 'inactivo' satisfies UserStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: 'Error al desactivar el usuario: ' + updateError.message }
      }
    } else {
      // Hard delete: eliminar de BD primero
      const { error: deleteError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId)

      if (deleteError) {
        return { success: false, error: 'Error al eliminar el usuario de la base de datos: ' + deleteError.message }
      }

      // Luego eliminar de auth usando cliente admin (requiere service_role)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (authError) {
        console.error('Error al eliminar usuario de auth:', authError)
        // No retornamos error aquí porque ya se eliminó de la BD
      }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true, message: soft ? 'Usuario desactivado' : 'Usuario eliminado' }
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return { success: false, error: 'Error al eliminar el usuario' }
  }
}

/**
 * Reactiva un usuario inactivo
 */
export async function reactivarUsuario(userId: string): Promise<ActionResult> {
  try {
    const context = await getAdminContext()
    
    if (!context.success) {
      return { success: false, error: context.error }
    }

    const { supabase } = context

    const { error } = await supabase
      .from('usuarios')
      .update({
        estado: 'activo' satisfies UserStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error al reactivar usuario:', error)
      return { success: false, error: 'Error al reactivar el usuario: ' + error.message }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al reactivar usuario:', error)
    return { success: false, error: 'Error al reactivar el usuario' }
  }
}

/**
 * Cambia el rol de un usuario
 */
export async function cambiarRolUsuario(
  userId: string, 
  nuevoRol: string
): Promise<ActionResult> {
  try {
    const context = await getAdminContext()
    
    if (!context.success) {
      return { success: false, error: context.error }
    }

    if (!isValidRole(nuevoRol)) {
      return { success: false, error: `Rol no válido. Roles permitidos: ${ROLES_VALIDOS.join(', ')}` }
    }

    const { supabase, currentUserId } = context

    // Verificar que no se está cambiando el rol de sí mismo (para evitar perder acceso admin)
    if (currentUserId === userId && nuevoRol !== 'admin') {
      return { success: false, error: 'No puedes quitarte el rol de administrador a ti mismo' }
    }

    // Si se está quitando rol admin, verificar que no sea el último
    if (nuevoRol !== 'admin') {
      const { data: userToChange } = await supabase
        .from('usuarios')
        .select('rol, estado')
        .eq('id', userId)
        .single()

      if (userToChange?.rol === 'admin' && userToChange?.estado === 'activo') {
        const { count: adminCount } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })
          .eq('rol', 'admin')
          .eq('estado', 'activo')

        if (adminCount === 1) {
          return { success: false, error: 'No se puede quitar el rol de administrador al último admin activo' }
        }
      }
    }

    const { error } = await supabase
      .from('usuarios')
      .update({
        rol: nuevoRol,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error al cambiar rol:', error)
      return { success: false, error: 'Error al cambiar el rol del usuario: ' + error.message }
    }

    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al cambiar rol:', error)
    return { success: false, error: 'Error al cambiar el rol del usuario' }
  }
}
