'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createMember(formData: FormData) {
  try {
    const supabase = await createClient()

    // Verificar sesión del usuario
    const { data: { session }, error: sessionError } = await (supabase as any).auth.getSession()
    
    if (sessionError) {
      throw new Error('Error al verificar la sesión')
    }

    if (!session) {
      throw new Error('No hay una sesión válida')
    }

    const nombres = formData.get('nombres')?.toString()?.trim()
    const apellidos = formData.get('apellidos')?.toString()?.trim()
    const email = formData.get('email')?.toString()?.trim() || null
    const telefono = formData.get('telefono')?.toString()?.trim() || null

    if (!nombres || !apellidos) {
      throw new Error('Los campos nombres y apellidos son requeridos')
    }

    // Crear el miembro en la base de datos
    const { error: memberError } = await (supabase as any)
      .from('miembros')
      .insert([{
        nombres,
        apellidos,
        email,
        telefono
      }])

    if (memberError) {
      console.error('Error al crear miembro:', memberError)
      throw new Error('Error al crear el miembro')
    }

    // Todo salió bien
    revalidatePath('/dashboard/miembros')
    redirect('/dashboard/miembros')
    
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Error inesperado al procesar la solicitud')
  }
}
