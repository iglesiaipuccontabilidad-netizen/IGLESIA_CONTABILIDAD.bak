'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/database.types'

type VotoRow = Database['public']['Tables']['votos']['Row']
type PagoInsert = Database['public']['Tables']['pagos']['Insert']
type VotoUpdate = Database['public']['Tables']['votos']['Update']

export interface PagoInput {
  id: string
  monto: number
  fecha: string
  nota?: string | null
}

export async function registrarPago(data: PagoInput) {
  const supabase = await createClient() as any

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('No se pudo verificar el usuario')
    }

    const { data: votoData, error: votoError } = await supabase
      .from('votos')
      .select('monto_total, recaudado')
      .eq('id', data.id)
      .single()

    if (votoError || !votoData) {
      throw new Error('No se pudo obtener la información del voto')
    }

    const montoPendiente = Number(votoData.monto_total) - Number(votoData.recaudado)
    if (data.monto > montoPendiente) {
      throw new Error(`El monto máximo que puede abonar es ${montoPendiente}`)
    }

    const pagoData: PagoInsert = {
      voto_id: data.id,
      monto: data.monto,
      fecha_pago: data.fecha,
      nota: data.nota || null,
      registrado_por: user.id
    }

    const pago = await supabase
      .from('pagos')
      .insert(pagoData)

    if (pago.error) {
      throw new Error('Error al registrar el pago')
    }

    const updateData: VotoUpdate = {
      recaudado: Number(votoData.recaudado) + data.monto,
      updated_at: new Date().toISOString(),
      ultima_actualizacion_por: user.id
    }

    const actualizacion = await supabase
      .from('votos')
      .update(updateData)
      .eq('id', data.id)

    if (actualizacion.error) {
      // TODO: Implementar rollback del pago si falla la actualización
      throw new Error('Error al actualizar el voto')
    }

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