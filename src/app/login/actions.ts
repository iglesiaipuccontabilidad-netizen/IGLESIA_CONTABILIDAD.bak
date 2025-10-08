'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function logout() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error al cerrar sesión:', error.message)
  }
  
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function login(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return { error: 'Por favor ingresa tu correo y contraseña' }
    }

    const supabase = await createClient()

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

    revalidatePath('/', 'layout')
    return { success: true, redirect: '/dashboard' }
  } catch (error: any) {
    console.error('Error en login:', error)
    return { error: error.message || 'Ha ocurrido un error al iniciar sesión' }
  }
}

export async function signup(formData: FormData) {
  try {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const nombre = formData.get('nombre') as string
    const apellido = formData.get('apellido') as string

    if (!email || !password || !confirmPassword || !nombre || !apellido) {
      return { error: 'Por favor completa todos los campos' }
    }

    if (password !== confirmPassword) {
      return { error: 'Las contraseñas no coinciden' }
    }

    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          apellido,
        },
      },
    })

    if (signUpError) {
      console.error('Error en registro:', signUpError)
      return { 
        error: signUpError.message === 'User already registered'
          ? 'El usuario ya está registrado'
          : 'Ha ocurrido un error durante el registro'
      }
    }

    // Si el registro fue exitoso, retornamos éxito
    return { 
      success: true, 
      redirect: '/login?mensaje=Registro exitoso. Por favor inicia sesión.' 
    }

  } catch (error) {
    console.error('Error en signup:', error)
    return { 
      error: error instanceof Error ? error.message : 'Error al registrar usuario' 
    }
  }
}