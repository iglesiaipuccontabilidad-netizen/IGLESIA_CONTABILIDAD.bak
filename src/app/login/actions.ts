'use server'

import { createActionClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { type Database } from '@/lib/database.types'

export async function logout() {
  console.log('🚪 [Logout] Iniciando cierre de sesión...')
  
  const supabase = await createActionClient()
  
  // Cerrar sesión en el servidor
  const { error } = await supabase.auth.signOut({ scope: 'global' })
  
  if (error) {
    console.error('❌ [Logout] Error al cerrar sesión:', error.message)
  } else {
    console.log('✅ [Logout] Sesión cerrada correctamente')
  }
  
  // Revalidar todas las rutas para limpiar caché
  revalidatePath('/', 'layout')
  
  console.log('🔄 [Logout] Redirigiendo a login...')
  redirect('/login')
}

export async function signup(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const nombres = formData.get('nombres') as string
    const apellidos = formData.get('apellidos') as string
    const telefono = formData.get('telefono') as string
    const direccion = formData.get('direccion') as string

    if (!email || !password || !nombres || !apellidos) {
      return { error: 'Todos los campos son obligatorios' }
    }

    const supabase = await createActionClient()

    // 1. Crear el usuario en auth.users
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombres,
          apellidos,
          email_verified: false,
          phone_verified: false,
        }
      }
    })

    if (signUpError) {
      console.error('Error al crear usuario:', signUpError)
      return { error: 'Error al crear la cuenta. Por favor intenta de nuevo.' }
    }

    if (!authData.user) {
      return { error: 'Error al crear la cuenta' }
    }

    // 2. Crear el registro en la tabla usuarios
    const nuevoUsuario: Database['public']['Tables']['usuarios']['Insert'] = {
      id: authData.user.id,
      email,
      rol: 'pendiente',
      estado: 'pendiente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: userError } = await supabase
      .from('usuarios')
      .insert(nuevoUsuario as any)

    if (userError) {
      console.error('Error al crear registro de usuario:', userError)
      await supabase.auth.signOut()
      return { error: 'Error al crear el registro de usuario' }
    }

    // 3. Crear el registro en la tabla miembros
    const nuevoMiembro: Database['public']['Tables']['miembros']['Insert'] = {
      id: authData.user.id,
      nombres,
      apellidos,
      email,
      telefono: telefono || null,
      direccion: direccion || null,
      fecha_ingreso: new Date().toISOString(),
      estado: 'inactivo',
      rol: 'miembro'
    }

    const { error: memberError } = await supabase
      .from('miembros')
      .insert(nuevoMiembro as any)

    if (memberError) {
      console.error('Error al crear registro de miembro:', memberError)
      await supabase.auth.signOut()
      return { error: 'Error al crear el registro de miembro' }
    }

    return {
      success: true,
      redirect: '/login?message=registro-exitoso'
    }
  } catch (error: any) {
    console.error('Error en registro:', error)
    return { error: error.message || 'Ha ocurrido un error al registrarse' }
  }
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect_to') as string

  if (!email || !password) {
    return { error: 'Por favor ingresa tu correo y contraseña' }
  }

  try {
    const supabase = await createActionClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Error de login:', error.message)
      return { 
        error: error.message === 'Invalid login credentials' 
          ? 'Credenciales inválidas'
          : 'Ha ocurrido un error al iniciar sesión'
      }
    }

    if (!data.user) {
      return { error: 'Usuario no encontrado' }
    }

    // Verificar si el usuario existe en la tabla usuarios y está activo
    type UsuarioRow = Database['public']['Tables']['usuarios']['Row']
    
    // Esperar un momento para que la sesión se establezca completamente
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, rol, estado')
      .eq('id', data.user.id)
      .maybeSingle() as { 
        data: UsuarioRow | null, 
        error: any 
      }

    console.log('Resultado de verificación de usuario:', { 
      userId: data.user.id,
      userData, 
      userError,
      errorDetails: userError ? {
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code
      } : null
    })

    if (userError) {
      console.error('Error al verificar usuario:', {
        message: userError.message,
        code: userError.code,
        details: userError.details,
        hint: userError.hint
      })
      await supabase.auth.signOut()
      return { 
        error: `Error de base de datos: ${userError.message || 'No se pudo verificar el usuario'}` 
      }
    }

    if (!userData) {
      console.error('Usuario no encontrado en la tabla usuarios para ID:', data.user.id)
      await supabase.auth.signOut()
      return { 
        error: 'Usuario no encontrado en el sistema. Por favor contacta al administrador.' 
      }
    }

    if (userData.estado !== 'activo') {
      console.error('Usuario inactivo:', userData.estado)
      await supabase.auth.signOut()
      return { 
        error: 'Usuario no autorizado o inactivo. Por favor contacta al administrador.' 
      }
    }

    // Revalidar todo el layout para forzar la recarga del estado de autenticación
    revalidatePath('/', 'layout')
    revalidatePath('/dashboard', 'layout')
    
    // Retornar la URL de redirección al cliente en lugar de hacer redirect desde el servidor
    const finalRedirect = redirectTo ? decodeURIComponent(redirectTo) : '/dashboard'
    return { 
      success: true,
      redirect: finalRedirect
    }
  } catch (error: any) {
    console.error('Error en login:', error)
    return { error: error.message || 'Ha ocurrido un error al iniciar sesión' }
  }
}