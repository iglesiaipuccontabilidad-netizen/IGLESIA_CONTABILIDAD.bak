import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('=== INICIO POST /api/admin/usuarios ===')
  
  let supabase
  let body
  
  try {
    supabase = await createClient()
    console.log('✅ Cliente Supabase creado')
  } catch (error) {
    console.error('❌ Error al crear cliente Supabase:', error)
    return NextResponse.json(
      { error: 'Error al inicializar la conexión con la base de datos' },
      { status: 500 }
    )
  }

  try {
    body = await request.json()
    console.log('📥 Datos recibidos:', { email: body.email, rol: body.rol })
  } catch (error) {
    console.error('❌ Error al parsear JSON:', error)
    return NextResponse.json(
      { error: 'Datos inválidos' },
      { status: 400 }
    )
  }

  try {
    const { email, password, rol } = body

    // Verificar que el usuario actual es admin
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    console.log('👤 Usuario actual:', currentUser?.id, currentUser?.email)
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError)
      return NextResponse.json(
        { error: 'Error de autenticación: ' + authError.message },
        { status: 401 }
      )
    }
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario actual tiene rol de admin
    const { data: currentUserData } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || currentUserData.rol !== 'admin' || currentUserData.estado !== 'activo') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear usuarios' },
        { status: 403 }
      )
    }

    // Validar datos
    if (!email || !password || !rol) {
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

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Validar rol válido
    const rolesValidos = ['admin', 'tesorero', 'usuario', 'pendiente']
    if (!rolesValidos.includes(rol)) {
      return NextResponse.json(
        { error: 'Rol no válido' },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id, estado')
      .eq('email', email)
      .maybeSingle()

    // Si existe un usuario inactivo con este email, reactivarlo
    if (existingUser && existingUser.estado === 'inactivo') {
      console.log('Reactivando usuario inactivo:', email)
      
      // Actualizar la contraseña en auth
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      )

      if (passwordError) {
        console.error('Error al actualizar contraseña:', passwordError)
        return NextResponse.json(
          { error: 'Error al reactivar el usuario' },
          { status: 500 }
        )
      }

      // Reactivar el usuario en la tabla usuarios
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ 
          rol: rol as 'admin' | 'tesorero' | 'usuario' | 'pendiente',
          estado: 'activo',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('Error al reactivar usuario:', updateError)
        return NextResponse.json(
          { error: 'Error al reactivar el usuario' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true,
        user: {
          id: existingUser.id,
          email: email,
          rol: rol
        },
        message: 'Usuario reactivado exitosamente'
      })
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado' },
        { status: 400 }
      )
    }

    // Crear el usuario usando auth.admin.createUser (método correcto para admins)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        rol: rol,
        created_by_admin: true
      }
    })

    if (authError) {
      console.error('Error de autenticación:', authError)
      return NextResponse.json(
        { error: 'Error al crear el usuario: ' + authError.message },
        { status: 500 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      )
    }

    // El trigger de la base de datos creará automáticamente el registro en usuarios
    // con rol 'pendiente', así que actualizamos el rol si es diferente
    if (rol !== 'pendiente') {
      // Esperar un momento para que el trigger se ejecute
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ 
          rol: rol as 'admin' | 'tesorero' | 'usuario' | 'pendiente',
          estado: 'activo',
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.user.id)

      if (updateError) {
        console.error('Error al actualizar rol:', updateError)
        // No eliminamos el usuario, solo registramos el error
      }
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: authUser.user.id,
        email: email,
        rol: rol
      }
    })

  } catch (error) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}