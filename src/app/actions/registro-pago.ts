'use server'

import { registrarPago } from './pagos'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { withRetry } from '@/lib/utils/sessionHelper'

export interface ActionResponse {
  error: string | null
  success: boolean
  redirectUrl?: string
}

export type ActionState = {
  message: string | null
} | null

export async function procesarPago(
  id: string,
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Validar los datos del formulario
    const montoStr = formData.get('monto')
    if (!montoStr) {
      return {
        error: 'El monto es requerido',
        success: false
      }
    }

    const monto = Number(montoStr)
    if (isNaN(monto) || monto <= 0) {
      return {
        error: 'El monto debe ser un número válido mayor a cero',
        success: false
      }
    }

    // Procesar la fecha (usar la actual si no se proporciona)
    const fechaStr = formData.get('fecha')
    const fecha = fechaStr 
      ? new Date(fechaStr.toString()).toISOString()
      : new Date().toISOString()

    // Procesar la nota (opcional)
    const nota = formData.get('nota')?.toString() || ''

    // Registrar el pago con retry automático
    const result = await withRetry(
      () => registrarPago({
        id,
        monto,
        fecha,
        nota
      }),
      3, // 3 intentos
      1000 // 1 segundo entre intentos
    )

    if (!result.success) {
      return {
        error: result.error || 'Error al procesar el pago',
        success: false
      }
    }

    // Revalidar todas las rutas que muestran información de votos
    revalidatePath('/dashboard', 'layout') // Revalida el dashboard principal
    revalidatePath('/dashboard/votos', 'layout') // Revalida la lista de votos
    revalidatePath(`/dashboard/votos/${id}`) // Revalida los detalles del voto específico
    revalidatePath(`/dashboard/pagos/${id}`) // Revalida la página de pagos

    return { 
      error: null, 
      success: true
    }

  } catch (error) {
    // Log del error para debugging
    console.error('[procesarPago] Error:', error)

    // Determinar el mensaje de error apropiado
    let errorMessage = 'Error al procesar el pago. Por favor intente nuevamente.'
    
    if (error instanceof Error) {
      if (error.message.includes('Connect Timeout')) {
        errorMessage = 'No se pudo conectar con el servidor. Por favor, verifique su conexión.'
      } else {
        errorMessage = error.message
      }
    }

    return {
      error: errorMessage,
      success: false
    }
  }
}
