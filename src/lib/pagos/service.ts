import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../database.types'
import type { PagoFormData, RegistrarPagoArgs, PagoError } from './types'

const supabase = createClientComponentClient<Database>()

export async function registrarPago(
  formData: PagoFormData,
  votoId: string,
  montoTotal: number
): Promise<{ success: boolean; error?: PagoError }> {
  try {
    // 1. Verificar sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      throw new Error('Sesión no válida')
    }

    // 2. Preparar datos
    const monto = Math.round(parseFloat(formData.monto) * 100) / 100
    
    const payload: RegistrarPagoArgs = {
      p_voto_id: votoId,
      p_monto: monto,
      p_fecha_pago: formData.fecha_pago,
      p_metodo_pago: formData.metodo_pago,
      p_nota: formData.nota || null,
      p_registrado_por: session.user.id,
      p_monto_total: montoTotal
    }

    // 3. Registrar pago
    const { data, error: rpcError } = await supabase.rpc('registrar_pago', payload)
    
    if (rpcError) {
      const error: PagoError = new Error(rpcError.message)
      error.code = rpcError.code
      error.details = rpcError.details
      throw error
    }

    if (!data?.success) {
      throw new Error('No se pudo confirmar el registro del pago')
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { 
        success: false, 
        error: error as PagoError
      }
    }
    return { 
      success: false, 
      error: new Error('Error desconocido al procesar el pago')
    }
  }
}

export async function getVoto(votoId: string) {
  try {
    const { data, error } = await supabase
      .from('votos')
      .select('*')
      .eq('id', votoId)
      .single()
      
    if (error) throw error
    if (!data) throw new Error('Voto no encontrado')
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}