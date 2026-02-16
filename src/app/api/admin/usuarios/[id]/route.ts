/**
 * API Routes para gestión de usuario individual
 * Basado en mejores prácticas de Supabase
 * 
 * PUT: Actualizar usuario
 * DELETE: Eliminar usuario (soft/hard delete)
 */

import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/auth/verify-admin'
import { 
  isValidEmail, 
  isValidRole,
  isValidStatus,
  ROLES_VALIDOS,
  ESTADOS_VALIDOS,
  type UserRole,
  type UserStatus
} from '@/types/usuarios'

/**
 * PUT - Actualizar usuario
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { email, rol, estado } = await request.json()
    const { id: userId } = await context.params

    // Verificar permisos de admin usando helper centralizado
    const adminContext = await getAdminContext()
    
    if (!adminContext.success) {
      return NextResponse.json(
        { error: adminContext.error },
        { status: adminContext.error === 'No autenticado' ? 401 : 403 }
      )
    }

    const { supabase, supabaseAdmin } = adminContext

    // Validar datos
    if (!email || !rol || !estado) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (email, rol, estado)' },
        { status: 400 }
      )
    }

    // Validar formato de email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'El formato del correo electrónico no es válido' },
        { status: 400 }
      )
    }

    // Validar rol
    if (!isValidRole(rol)) {
      return NextResponse.json(
        { error: `Rol no válido. Roles permitidos: ${ROLES_VALIDOS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar estado
    if (!isValidStatus(estado)) {
      return NextResponse.json(
        { error: `Estado no válido. Estados permitidos: ${ESTADOS_VALIDOS.join(', ')}` },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe en organizacion_usuarios
    const { data: existingUser, error: fetchError } = await supabase
      .from('organizacion_usuarios')
      .select('usuario_id, rol, estado')
      .eq('usuario_id', userId)
      .maybeSingle()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar email via auth.users
    const { data: { user: currentAuthUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
    const currentEmail = currentAuthUser?.email

    if (email !== currentEmail) {
      // Actualizar email en auth.users usando cliente admin (requiere service_role)
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email }
      )

      if (authError) {
        console.error('Error al actualizar email en auth:', authError)
        return NextResponse.json(
          { error: 'Error al actualizar el email en autenticación: ' + authError.message },
          { status: 500 }
        )
      }
    }

    // Actualizar en organizacion_usuarios
    const { data: updatedUser, error: updateError } = await supabase
      .from('organizacion_usuarios')
      .update({
        rol: rol as UserRole,
        estado: estado as UserStatus,
        updated_at: new Date().toISOString()
      })
      .eq('usuario_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error al actualizar usuario:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar el usuario: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error en PUT /api/admin/usuarios/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Eliminar usuario
 * @query soft=true - Soft delete (cambia estado a inactivo)
 * @query soft=false - Hard delete (elimina de BD y auth)
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params
    const { searchParams } = new URL(request.url)
    const soft = searchParams.get('soft') !== 'false' // Por defecto es soft delete

    // Verificar permisos de admin usando helper centralizado
    const adminContext = await getAdminContext()
    
    if (!adminContext.success) {
      return NextResponse.json(
        { error: adminContext.error },
        { status: adminContext.error === 'No autenticado' ? 401 : 403 }
      )
    }

    const { supabase, supabaseAdmin, currentUserId } = adminContext

    // Verificar que no se está eliminando a sí mismo
    if (currentUserId === userId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Verificar que el usuario a eliminar existe
    const { data: userToDelete, error: fetchError } = await supabase
      .from('organizacion_usuarios')
      .select('usuario_id, rol, estado')
      .eq('usuario_id', userId)
      .maybeSingle()

    if (fetchError || !userToDelete) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Contar cuántos admins activos hay
    const { count: adminCount } = await supabase
      .from('organizacion_usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'admin')
      .eq('estado', 'activo')

    // Si es el último admin activo, no permitir eliminación
    if (userToDelete.rol === 'admin' && userToDelete.estado === 'activo' && adminCount === 1) {
      return NextResponse.json(
        { error: 'No se puede eliminar el último administrador activo del sistema' },
        { status: 400 }
      )
    }

    if (soft) {
      // Soft delete: solo cambiar estado a inactivo
      const { error: updateError } = await supabase
        .from('organizacion_usuarios')
        .update({
          estado: 'inactivo' as UserStatus,
          updated_at: new Date().toISOString()
        })
        .eq('usuario_id', userId)

      if (updateError) {
        console.error('Error al desactivar usuario:', updateError)
        return NextResponse.json(
          { error: 'Error al desactivar el usuario: ' + updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario desactivado exitosamente'
      })
    } else {
      // Hard delete: eliminar de organizacion_usuarios primero, luego de auth
      const { error: deleteError } = await supabase
        .from('organizacion_usuarios')
        .delete()
        .eq('usuario_id', userId)

      if (deleteError) {
        console.error('Error al eliminar usuario de BD:', deleteError)
        return NextResponse.json(
          { error: 'Error al eliminar el usuario de la base de datos: ' + deleteError.message },
          { status: 500 }
        )
      }

      // Eliminar de auth usando cliente admin (requiere service_role)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (authError) {
        console.error('Error al eliminar usuario de auth:', authError)
        // No fallamos aquí porque ya se eliminó de la BD
        // Solo logueamos el error
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario eliminado permanentemente'
      })
    }

  } catch (error) {
    console.error('Error en DELETE /api/admin/usuarios/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET - Obtener información de un usuario específico
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params

    // Verificar permisos de admin
    const adminContext = await getAdminContext()
    
    if (!adminContext.success) {
      return NextResponse.json(
        { error: adminContext.error },
        { status: adminContext.error === 'No autenticado' ? 401 : 403 }
      )
    }

    const { supabase } = adminContext

    const { data: user, error } = await supabase
      .from('organizacion_usuarios')
      .select('usuario_id, rol, estado, created_at, updated_at')
      .eq('usuario_id', userId)
      .maybeSingle()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Error en GET /api/admin/usuarios/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
