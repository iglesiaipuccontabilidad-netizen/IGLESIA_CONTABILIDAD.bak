import type { Database } from '@/lib/database.types'

export type MetodoPago = 'efectivo' | 'transferencia' | 'cheque' | 'otro'

export interface PagoFormData {
  monto: string
  fecha_pago: string
  metodo_pago: MetodoPago
  nota?: string
}

export type RegistrarPagoArgs = Database['public']['Functions']['registrar_pago_comite']['Args']
export type RegistrarPagoResult = Database['public']['Functions']['registrar_pago_comite']['Returns']

export interface PagoError extends Error {
  code?: string
  details?: string
}