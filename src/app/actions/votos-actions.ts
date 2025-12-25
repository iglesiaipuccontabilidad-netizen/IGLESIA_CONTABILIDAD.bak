'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/database.types'
import type { 
  VotoInput, 
  VotoUpdateInput, 
  PagoInput, 
  VotoDetalle,
  VotoBase
} from '@/types/votos'
import { withRetry } from '@/lib/utils/sessionHelper'

type Tables = Database['public']['Tables']
type VotoSchema = Tables['votos']
type VotoRow = VotoSchema['Row']
type VotoInsert = VotoSchema['Insert']
type VotoUpdate = VotoSchema['Update']
type PagoRow = Tables['pagos']['Row']

export async function createVoto(data: VotoInput): Promise<{
  success: boolean;
  error: any | null;
}> {
  return withRetry(async () => {
    const supabase = await createClient()
    
    try {
      // Verificar autenticación y permisos
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('No autenticado')
      }

      const { data: userData } = await supabase
        .from('usuarios')
        .select('rol, estado')
        .eq('id', user.id)
        .single()

      if (!userData || userData.estado !== 'activo') {
        throw new Error('Usuario no autorizado')
      }

      // Solo admin y tesorero pueden crear votos
      if (!['admin', 'tesorero'].includes(userData.rol)) {
        throw new Error('No tienes permisos para crear votos')
      }

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

      return { success: true, error: null }
    } catch (error) {
      console.error('Error al crear voto:', error)
      return { success: false, error }
    }
  }, 3, 1000)
}

export async function updateVoto(
  id: string, 
  data: VotoUpdateInput
): Promise<{
  success: boolean;
  error: any | null;
}> {
  return withRetry(async () => {
    const supabase = await createClient()
    
    try {
      // Verificar autenticación y permisos
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('No autenticado')
      }

      const { data: userData } = await supabase
        .from('usuarios')
        .select('rol, estado')
        .eq('id', user.id)
        .single()

      if (!userData || userData.estado !== 'activo') {
        throw new Error('Usuario no autorizado')
      }

      // Solo admin y tesorero pueden editar votos
      if (!['admin', 'tesorero'].includes(userData.rol)) {
        throw new Error('No tienes permisos para editar votos')
      }

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
      revalidatePath(`/dashboard/votos/${id}`)

      return { success: true, error: null }
    } catch (error) {
      console.error('Error al actualizar voto:', error)
      return { success: false, error }
    }
  }, 3, 1000)
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
    revalidatePath(`/dashboard/votos/${votoId}`)

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

export async function deleteVoto(id: string): Promise<{
  success: boolean;
  error: any | null;
}> {
  const supabase = await createClient()
  
  try {
    // Verificar autenticación y permisos
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('No autenticado')
    }

    const { data: userData } = await supabase
      .from('usuarios')
      .select('rol, estado')
      .eq('id', user.id)
      .single()

    if (!userData || userData.estado !== 'activo') {
      throw new Error('Usuario no autorizado')
    }

    // Solo admin puede eliminar votos
    if (userData.rol !== 'admin') {
      throw new Error('No tienes permisos para eliminar votos')
    }

    // Primero eliminar los pagos asociados
    const { error: pagosError } = await (supabase as any)
      .from('pagos')
      .delete()
      .eq('voto_id', id)

    if (pagosError) throw pagosError

    // Luego eliminar el voto
    const { error } = await (supabase as any)
      .from('votos')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Revalidar datos
    revalidatePath('/dashboard/votos')
    revalidatePath('/dashboard')

    return { success: true, error: null }
  } catch (error) {
    console.error('Error al eliminar voto:', error)
    return { success: false, error }
  }
}
