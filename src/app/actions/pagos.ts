'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/database.types'

export interface PagoInput {
  votoId: string
  monto: number
  fecha: string
  nota?: string | null
}

export async function registrarPago(data: PagoInput) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieJar = await cookies()
          return cookieJar.get(name)?.value
        },
        async set(name: string, value: string, options: any) {
          const cookieJar = await cookies()
          cookieJar.set(name, value, options)
        },
        async remove(name: string, options: any) {
          const cookieJar = await cookies()
          cookieJar.delete(name)
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
      .eq('id', data.votoId)
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
        voto_id: data.votoId,
        monto: data.monto,
        fecha_pago: data.fecha,
        nota: data.nota,
        registrado_por: user.id
      })

    if (pago.error) {
      throw new Error('Error al registrar el pago')
    }

    const actualizacion = await supabase
      .from('votos')
      .update({
        recaudado: Number(voto.data.recaudado) + data.monto,
        updated_at: new Date().toISOString(),
        ultima_actualizacion_por: user.id
      })
      .eq('id', data.votoId)

    if (actualizacion.error) {
      // TODO: Implementar rollback del pago si falla la actualización
      throw new Error('Error al actualizar el voto')
    }

    revalidatePath(`/dashboard/votos/${data.votoId}`)
    revalidatePath(`/dashboard/votos/${data.votoId}/pago`)
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