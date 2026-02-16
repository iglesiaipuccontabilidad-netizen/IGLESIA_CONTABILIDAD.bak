import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']
type VotoRow = Tables['votos']['Row']
type PagoRow = Tables['pagos']['Row']

export type VotoBase = VotoRow & {
  miembro?: {
    id: string
    nombres: string
    apellidos: string
  }
  pagos?: PagoRow[]
}

export type VotoDetalle = VotoBase & {
  progreso: number
  total_pagado: number
  proposito_nombre?: string
  proposito_obj?: {
    id: string
    nombre: string
  } | null
}

export type VotoInput = {
  miembro_id: string
  proposito: string
  proposito_id?: string | null
  monto_total: number
  fecha_limite: string
  estado?: 'activo' | 'completado' | 'cancelado' | 'vencido'
  creado_por: string
  ultima_actualizacion_por?: string
}

export type VotoUpdateInput = Partial<VotoInput>

export type PagoInput = {
  voto_id: string
  monto: number
  fecha_pago: string
  nota?: string
  registrado_por: string
  metodo_pago: 'efectivo' | 'transferencia' | 'cheque' | 'otro'
}

export type PagoDetalle = PagoRow & {
  voto?: VotoBase
  registrador?: {
    id: string
    nombres: string
    apellidos: string
  }
}