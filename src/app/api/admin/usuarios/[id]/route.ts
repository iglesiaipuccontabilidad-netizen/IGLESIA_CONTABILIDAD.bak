import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PUT - Actualizar usuario
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { email, rol, estado } = await request.json()
    const userId = params.id

    // Validar datos
    if (!email || !rol || !estado) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'El formato del correo electrónico no es válido' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const { data: existingUser, error: fetchError } = await (supabase as any)
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email !== existingUser.email) {
      const { data: emailCheck } = await (supabase as any)
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .maybeSingle()

      if (emailCheck) {
        return NextResponse.json(
          { error: 'El correo electrónico ya está en uso' },
          { status: 400 }
        )
      }

      // Actualizar email en auth.users
      const { error: authError } = await (supabase as any).auth.admin.updateUserById(
        userId,
        { email }
      )

      if (authError) {
        console.error('Error al actualizar email en auth:', authError)
        return NextResponse.json(
          { error: 'Error al actualizar el email en autenticación' },
          { status: 500 }
        )
      }
    }

    // Actualizar en la tabla usuarios
    const { data: updatedUser, error: updateError } = await (supabase as any)
      .from('usuarios')
      .update({
        email,
        rol: rol as 'admin' | 'tesorero' | 'usuario' | 'pendiente',
        estado: estado as 'activo' | 'inactivo',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
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
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const userId = params.id
    const { searchParams } = new URL(request.url)
    const soft = searchParams.get('soft') === 'true'

    // Obtener el usuario actual (quien está haciendo la petición)
    const { data: { user: currentUser } } = await (supabase as any).auth.getUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que no se está eliminando a sí mismo
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Verificar que el usuario a eliminar existe
    const { data: userToDelete, error: fetchError } = await (supabase as any)
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !userToDelete) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Contar cuántos admins hay
    const { count: adminCount } = await (supabase as any)
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'admin')
      .eq('estado', 'activo')

    // Si es el último admin, no permitir eliminación
    if (userToDelete.rol === 'admin' && userToDelete.estado === 'activo' && adminCount === 1) {
      return NextResponse.json(
        { error: 'No se puede eliminar el último administrador activo' },
        { status: 400 }
      )
    }

    if (soft) {
      // Soft delete: solo cambiar estado
      const { error: updateError } = await (supabase as any)
        .from('usuarios')
        .update({
          estado: 'inactivo',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Error al desactivar el usuario' },
          { status: 500 }
        )
      }
    } else {
      // Hard delete: eliminar de auth y BD
      const { error: deleteError } = await (supabase as any)
        .from('usuarios')
        .delete()
        .eq('id', userId)

      if (deleteError) {
        return NextResponse.json(
          { error: 'Error al eliminar el usuario de la base de datos' },
          { status: 500 }
        )
      }

      // Eliminar de auth
      const { error: authError } = await (supabase as any).auth.admin.deleteUser(userId)

      if (authError) {
        console.error('Error al eliminar usuario de auth:', authError)
        // No retornamos error aquí porque ya se eliminó de la BD
      }
    }

    return NextResponse.json({
      success: true,
      message: soft ? 'Usuario desactivado exitosamente' : 'Usuario eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
