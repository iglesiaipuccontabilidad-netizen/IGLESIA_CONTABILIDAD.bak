import { Database } from '@/lib/database.types'

export interface VotoBase {
  id: string
  estado: string
  proposito: string
  monto_total: number
  recaudado: number | null
}

export interface Miembro {
  id: string
  nombres: string
  apellidos: string
  cedula: string
  email: string | null
  telefono: string | null
  direccion: string | null
  created_at: string
  updated_at: string
  fecha_ingreso: string
  estado: 'activo' | 'inactivo'
  rol: 'miembro' | 'admin' | 'tesorero'
}

export interface MiembroConVotos extends Miembro {
  votos_activos: VotoBase[]
}

export interface MiembroFormData {
  nombres: string
  apellidos: string
  cedula: string
  email?: string | null
  telefono?: string | null
  direccion?: string | null
  fecha_ingreso: string
  estado?: 'activo' | 'inactivo'
  rol?: 'miembro' | 'admin' | 'tesorero'
}

export interface MiembroError {
  nombres?: string
  apellidos?: string
  cedula?: string
  email?: string
  telefono?: string
  direccion?: string
  fecha_ingreso?: string
}
