'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'

export async function actualizarEstadoVoto(votoId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.delete(name)
        },
      },
    }
  )

  try {
    // Obtener el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('No se pudo verificar el usuario')
    }

    // Obtener los datos actuales del voto
    const { data: voto, error: votoError } = await supabase
      .from('votos')
      .select('monto_total, recaudado, estado')
      .eq('id', votoId)
      .single()

    if (votoError || !voto) {
      throw new Error('No se pudo obtener la información del voto')
    }

    // Calcular si el voto está completado
    const nuevoEstado = Number(voto.recaudado) >= Number(voto.monto_total) ? 'completado' : 'activo'

    // Si el estado ya es correcto, no hacer nada
    if (voto.estado === nuevoEstado) {
      return { success: true, message: 'El estado ya está actualizado' }
    }

    // Actualizar el estado del voto
    const { error: updateError } = await supabase
      .from('votos')
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
        ultima_actualizacion_por: user.id
      })
      .eq('id', votoId)

    if (updateError) {
      throw new Error('Error al actualizar el estado del voto')
    }

    // Revalidar las rutas afectadas
    revalidatePath(`/dashboard/votos/${votoId}`)
    revalidatePath('/dashboard/votos')

    return { 
      success: true, 
      message: `Estado actualizado a ${nuevoEstado}` 
    }

  } catch (error) {
    console.error('Error en actualizarEstadoVoto:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar el estado del voto'
    }
  }
}