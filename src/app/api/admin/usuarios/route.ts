import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(request: Request) {
  try {
    const { email, password, rol } = await request.json()
    
    // Cliente admin con service_role para operaciones auth.admin
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Cliente normal para verificar el usuario actual
    const { createClient: createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()
    
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: currentUserData } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || currentUserData.rol !== 'admin' || currentUserData.estado !== 'activo') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    if (!email || !password || !rol) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Contraseña muy corta' }, { status: 400 })
    }

    const rolesValidos = ['admin', 'tesorero', 'usuario', 'pendiente']
    if (!rolesValidos.includes(rol)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id, estado')
      .eq('email', email)
      .maybeSingle()

    if (existingUser && existingUser.estado === 'inactivo') {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      )

      if (passwordError) {
        return NextResponse.json({ error: 'Error al reactivar' }, { status: 500 })
      }

      const { error: updateError } = await supabaseAdmin
        .from('usuarios')
        .update({ 
          rol: rol as 'admin' | 'tesorero' | 'usuario' | 'pendiente',
          estado: 'activo',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)

      if (updateError) {
        return NextResponse.json({ error: 'Error al reactivar' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true,
        user: { id: existingUser.id, email, rol },
        message: 'Usuario reactivado'
      })
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 })
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { rol, created_by_admin: true }
    })

    if (authError || !authUser.user) {
      return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
    }

    if (rol !== 'pendiente') {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await supabaseAdmin
        .from('usuarios')
        .update({ 
          rol: rol as 'admin' | 'tesorero' | 'usuario' | 'pendiente',
          estado: 'activo',
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.user.id)
    }

    return NextResponse.json({ 
      success: true,
      user: { id: authUser.user.id, email, rol }
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
