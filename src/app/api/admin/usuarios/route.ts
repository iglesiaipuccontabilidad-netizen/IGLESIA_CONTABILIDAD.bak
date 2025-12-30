/**
 * API Route para crear usuarios
 * Basado en mejores prácticas de Supabase
 * 
 * @see https://supabase.com/docs/reference/javascript/auth-admin-createuser
 */

import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/auth/verify-admin'
import { 
  isValidEmail, 
  isValidPassword, 
  isValidRole,
  ROLES_VALIDOS,
  PASSWORD_MIN_LENGTH,
  type UserRole,
  type UserStatus
} from '@/types/usuarios'

export async function POST(request: Request) {
  try {
    const { email, password, rol } = await request.json()
    
    // Verificar permisos de admin usando helper centralizado
    const context = await getAdminContext()
    
    if (!context.success) {
      return NextResponse.json(
        { error: context.error }, 
        { status: context.error === 'No autenticado' ? 401 : 403 }
      )
    }

    const { supabase, supabaseAdmin } = context

    // Validaciones con helpers tipados
    if (!email || !password || !rol) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 })
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` }, 
        { status: 400 }
      )
    }

    if (!isValidRole(rol)) {
      return NextResponse.json(
        { error: `Rol inválido. Roles permitidos: ${ROLES_VALIDOS.join(', ')}` }, 
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id, estado')
      .eq('email', email)
      .maybeSingle()

    // Si existe pero está inactivo, reactivar
    if (existingUser && existingUser.estado === 'inactivo') {
      // Actualizar contraseña en auth usando cliente admin
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      )

      if (passwordError) {
        console.error('Error al actualizar contraseña:', passwordError)
        return NextResponse.json(
          { error: 'Error al reactivar usuario: ' + passwordError.message }, 
          { status: 500 }
        )
      }

      // Reactivar en tabla usuarios
      const { error: updateError } = await supabaseAdmin
        .from('usuarios')
        .update({ 
          rol: rol as UserRole,
          estado: 'activo' as UserStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('Error al reactivar usuario:', updateError)
        return NextResponse.json(
          { error: 'Error al reactivar usuario: ' + updateError.message }, 
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true,
        user: { id: existingUser.id, email, rol },
        message: 'Usuario reactivado exitosamente'
      })
    }

    // Si existe y está activo, error
    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' }, 
        { status: 400 }
      )
    }

    // Crear nuevo usuario en auth usando auth.admin.createUser
    // Esto requiere service_role key y crea el usuario sin necesidad de verificación de email
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // El email se marca como verificado automáticamente
      user_metadata: { 
        rol, 
        created_by_admin: true,
        created_at: new Date().toISOString()
      }
    })

    if (authError || !authUser.user) {
      console.error('Error al crear usuario en auth:', authError)
      return NextResponse.json(
        { error: 'Error al crear usuario: ' + (authError?.message || 'Error desconocido') }, 
        { status: 500 }
      )
    }

    // El trigger handle_new_user debería crear el registro en la tabla usuarios
    // Pero actualizamos el rol si no es 'pendiente'
    if (rol !== 'pendiente') {
      // Pequeño delay para asegurar que el trigger se ejecutó
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const { error: updateError } = await supabaseAdmin
        .from('usuarios')
        .update({ 
          rol: rol as UserRole,
          estado: 'activo' as UserStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.user.id)

      if (updateError) {
        console.error('Error al actualizar rol de usuario:', updateError)
        // No fallamos aquí porque el usuario ya fue creado
      }
    }

    return NextResponse.json({ 
      success: true,
      user: { 
        id: authUser.user.id, 
        email: authUser.user.email, 
        rol 
      }
    })

  } catch (error) {
    console.error('Error en POST /api/admin/usuarios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}
