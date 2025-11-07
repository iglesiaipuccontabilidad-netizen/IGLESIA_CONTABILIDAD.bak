'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import type { 
  VotoInput, 
  VotoUpdateInput, 
  PagoInput, 
  VotoDetalle,
  VotoBase
} from '@/types/votos'

type Tables = Database['public']['Tables']
type VotoSchema = Tables['votos']
type VotoRow = VotoSchema['Row']
type VotoInsert = VotoSchema['Insert']
type VotoUpdate = VotoSchema['Update']
type PagoRow = Tables['pagos']['Row']

const client = createClientComponentClient<Database>()

export async function createVoto(data: VotoInput): Promise<{
  success: boolean;
  error: any | null;
}> {
  const supabase = await createClient()
  
  try {
    // Prepare the voto data
    const votoData = {
      ...data,
      recaudado: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any

    const { error } = await (supabase as any)
      .from('votos')
      .insert([votoData])

    if (error) throw error

    // Revalidar datos
    revalidatePath('/dashboard/votos')
    revalidatePath('/dashboard')
    revalidateTag('votos')
    revalidateTag(`miembro-votos-${data.miembro_id}`)

    return { success: true, error: null }
  } catch (error) {
    console.error('Error al crear voto:', error)
    return { success: false, error }
  }
}

export async function updateVoto(
  id: string, 
  data: VotoUpdateInput
): Promise<{
  success: boolean;
  error: any | null;
}> {
  const supabase = await createClient()
  
  try {
    const { error } = await (supabase as any)
      .from('votos')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    // Revalidar datos
    revalidatePath('/dashboard/votos')
    revalidatePath('/dashboard')
    revalidateTag('votos')
    revalidateTag(`voto-${id}`)
    
    if (data.miembro_id) {
      revalidateTag(`miembro-votos-${data.miembro_id}`)
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error al actualizar voto:', error)
    return { success: false, error }
  }
}

export async function registerPago(
  votoId: string,
  data: {
    monto: number
    fecha_pago: string
    nota?: string
    registrado_por: string
    metodo_pago: 'efectivo' | 'transferencia' | 'cheque' | 'otro'
  }
): Promise<{
  success: boolean;
  error: any | null;
}> {
  const supabase = await createClient()
  
  try {
    // 1. Obtener el voto actual
    const { data: voto, error: votoError } = await (supabase as any)
      .from('votos')
      .select('recaudado, monto_total, miembro_id')
      .eq('id', votoId)
      .single()

    if (votoError) throw votoError

    // 2. Validar que no exceda el monto total
    const nuevoRecaudado = (voto.recaudado || 0) + data.monto
    if (nuevoRecaudado > voto.monto_total) {
      throw new Error('El pago excede el monto total del voto')
    }

    // 3. Iniciar transacción
    // Registrar pago
    const { error: pagoError } = await (supabase as any)
      .from('pagos')
      .insert([{
        voto_id: votoId,
        ...data
      }])

    if (pagoError) throw pagoError

    // Actualizar monto recaudado
    const { error: updateError } = await (supabase as any)
      .from('votos')
      .update({ 
        recaudado: nuevoRecaudado,
        estado: nuevoRecaudado >= voto.monto_total ? 'completado' : 'activo',
        updated_at: new Date().toISOString()
      })
      .eq('id', votoId)

    if (updateError) throw updateError

    // Revalidar datos
    revalidatePath('/dashboard/votos')
    revalidatePath('/dashboard')
    revalidateTag('votos')
    revalidateTag(`voto-${votoId}`)
    revalidateTag(`miembro-votos-${voto.miembro_id}`)

    return { success: true, error: null }
  } catch (error) {
    console.error('Error al registrar pago:', error)
    return { success: false, error }
  }
}


export async function getVotoById(id: string): Promise<{
  data: VotoDetalle | null;
  error: any | null;
}> {
  const supabase = await createClient()
  
  try {
    const { data: voto, error } = await (supabase as any)
      .from('votos')
      .select(`
        *,
        miembro:miembros!inner(
          id,
          nombres,
          apellidos
        ),
        pagos(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Procesar y calcular progreso
    const votoProcessed = {
      ...voto,
      progreso: Math.round(((voto.recaudado || 0) / voto.monto_total) * 100)
    }

    return { data: votoProcessed, error: null }
  } catch (error) {
    console.error('Error al obtener voto:', error)
    return { data: null, error }
  }
}

export async function getPagosForVoto(votoId: string): Promise<{
  data: PagoRow[] | null;
  error: any | null;
}> {
  const supabase = await createClient()
  
  try {
    const { data: pagos, error } = await (supabase as any)
      .from('pagos')
      .select('*')
      .eq('voto_id', votoId)
      .order('fecha_pago', { ascending: false })

    if (error) throw error

    return { data: pagos, error: null }
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return { data: null, error }
  }
}

export async function getVotosWithDetails(): Promise<{
  data: VotoDetalle[] | null;
  error: any | null;
}> {
  const supabase = await createClient()
  
  try {
    const { data: votos, error } = await (supabase as any)
      .from('votos')
      .select(`
        *,
        miembro:miembros!inner(
          id,
          nombres,
          apellidos
        ),
        pagos(
          monto,
          fecha_pago
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Procesar y calcular totales
    const votosProcessed = votos.map((voto: any) => {
      const total_pagado = voto.pagos?.reduce((sum: number, pago: any) => sum + (pago.monto || 0), 0) || 0;
      return {
        ...voto,
        total_pagado,
        progreso: Math.round((total_pagado / voto.monto_total) * 100)
      };
    })

    return { data: votosProcessed, error: null }
  } catch (error) {
    console.error('Error al obtener votos:', error)
    return { data: null, error }
  }
}
