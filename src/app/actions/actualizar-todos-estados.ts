'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'
import { actualizarEstadoVoto } from './actualizar-estado-voto'

export async function actualizarTodosLosEstados() {
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
    // Obtener todos los votos
    const { data: votos, error: votosError } = await supabase
      .from('votos')
      .select('id')
      .not('estado', 'eq', 'cancelado')

    if (votosError) {
      throw new Error('Error al obtener los votos')
    }

    // Actualizar el estado de cada voto
    const actualizaciones = await Promise.all(
      votos.map(voto => actualizarEstadoVoto(voto.id))
    )

    // Contar actualizaciones exitosas y fallidas
    const resultados = actualizaciones.reduce((acc, res) => {
      if (res.success) {
        acc.exitosas++
      } else {
        acc.fallidas++
      }
      return acc
    }, { exitosas: 0, fallidas: 0 })

    // Revalidar la página principal de votos
    revalidatePath('/dashboard/votos')

    return {
      success: true,
      message: `Se actualizaron ${resultados.exitosas} votos exitosamente. ${resultados.fallidas} actualizaciones fallaron.`
    }

  } catch (error) {
    console.error('Error en actualizarTodosLosEstados:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar los estados'
    }
  }
}