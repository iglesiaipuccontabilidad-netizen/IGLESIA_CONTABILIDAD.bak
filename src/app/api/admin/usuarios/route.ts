import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { typedFromTable } from '@/lib/supabase/typed-client'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { email, password, rol } = await request.json()

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

    // Crear el usuario en auth
    const { data: authUser, error: authError } = await (supabase as any).auth.signUp({
      email,
      password,
    })

    if (authError) {
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

    // Crear el registro en la tabla miembros
    const { error: dbError } = await (supabase as any)
      .from('usuarios')
      .insert({
        id: authUser.user.id,
        email: email,
        rol: rol as 'admin' | 'usuario' | 'pendiente',
        estado: 'activo'
      })

    if (dbError) {
      // Si falla la inserción en la tabla miembros, eliminar el usuario de auth
      await (supabase as any).auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { error: 'Error al crear el perfil del usuario: ' + dbError.message },
        { status: 500 }
      )
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