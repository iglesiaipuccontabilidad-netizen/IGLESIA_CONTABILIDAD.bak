import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/lib/database.types'
import { getCookieValue } from './cookies'
import { VotoConRelaciones, VotoBasico, InsertPago, VotoUpdate } from '@/types/supabase'
import { typedFromTable } from './typed-client'

export async function createActionClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function getVotoById(votoId: string): Promise<VotoConRelaciones> {
  const supabase = await createActionClient()
  
  const { data: voto, error } = await supabase
    .from('votos')
    .select(`
      *,
      miembro:miembros (
        id,
        nombres,
        apellidos,
        email
      ),
      pagos:pagos (
        id,
        monto,
        fecha_pago,
        nota
      )
    `)
    .eq('id', votoId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Type guard para verificar que las relaciones se cargaron correctamente
  if (!voto.miembro || typeof voto.miembro === 'string' || 'error' in voto.miembro) {
    throw new Error('Error al cargar datos del miembro')
  }

  if (!Array.isArray(voto.pagos)) {
    throw new Error('Error al cargar datos de pagos')
  }

  return voto as unknown as VotoConRelaciones
}

export async function registrarPago({
  votoId,
  monto,
  nota
}: {
  votoId: string
  monto: number
  nota?: string
}) {
  const supabase = await createActionClient()

  // Iniciar una transacción para actualizar el voto y registrar el pago
  const { data, error: votoError } = await supabase
    .from('votos')
    .select('recaudado, monto_total')
    .eq('id', votoId)
    .single()

  if (votoError || !data) {
    throw new Error(votoError?.message || 'Voto no encontrado')
  }

  const voto = data as VotoBasico
  const nuevoRecaudado = (voto.recaudado || 0) + monto
  
  if (nuevoRecaudado > voto.monto_total) {
    throw new Error('El monto del pago excede el valor pendiente del voto')
  }

  const supabaseClient = await createActionClient()

  // Registrar el pago
  const nuevoPago: InsertPago = {
    voto_id: votoId,
    monto,
    nota: nota || null,
    fecha_pago: new Date().toISOString(),
    registrado_por: votoId // TODO: Reemplazar con el ID del usuario actual
  }

  const { error: pagoError } = await supabaseClient
    .from('pagos')
    .insert(nuevoPago as never)

  if (pagoError) {
    throw new Error(pagoError.message)
  }

  // Actualizar el monto recaudado en el voto
  const actualizacion: VotoUpdate = {
    recaudado: nuevoRecaudado
  }

  const { error: updateError } = await supabaseClient
    .from('votos')
    .update(actualizacion as never)
    .eq('id', votoId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  return { success: true }
}