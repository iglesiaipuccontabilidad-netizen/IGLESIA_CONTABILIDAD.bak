'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/database.types'
import { actualizarEstadoVoto } from './actualizar-estado-voto'

export interface PagoInput {
  id: string
  monto: number
  fecha: string
  nota?: string | null
}

export async function registrarPago(data: PagoInput) {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('No se pudo verificar el usuario')
    }

    const voto = await supabase
      .from('votos')
      .select('monto_total, recaudado')
      .eq('id', data.id)
      .single()

    if (voto.error || !voto.data) {
      throw new Error('No se pudo obtener la información del voto')
    }

    const montoPendiente = Number(voto.data.monto_total) - Number(voto.data.recaudado)
    if (data.monto > montoPendiente) {
      throw new Error(`El monto máximo que puede abonar es ${montoPendiente}`)
    }

    const pago = await supabase
      .from('pagos')
      .insert({
        voto_id: data.id,
        monto: data.monto,
        fecha_pago: data.fecha,
        nota: data.nota,
        registrado_por: user.id
      })

    if (pago.error) {
      throw new Error('Error al registrar el pago')
    }

    const nuevoMontoRecaudado = Number(voto.data.recaudado) + data.monto
    
    const actualizacion = await supabase
      .from('votos')
      .update({
        recaudado: nuevoMontoRecaudado,
        updated_at: new Date().toISOString(),
        ultima_actualizacion_por: user.id
      })
      .eq('id', data.id)

    if (actualizacion.error) {
      // TODO: Implementar rollback del pago si falla la actualización
      throw new Error('Error al actualizar el voto')
    }

    // Actualizar el estado del voto después de registrar el pago
    await actualizarEstadoVoto(data.id)

    revalidatePath(`/dashboard/votos/${data.id}`)
    revalidatePath(`/dashboard/pagos/nuevo?voto=${data.id}`)
    revalidatePath('/dashboard/votos')

    return { success: true }

  } catch (error) {
    console.error('Error en registrarPago:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar el pago'
    }
  }
}