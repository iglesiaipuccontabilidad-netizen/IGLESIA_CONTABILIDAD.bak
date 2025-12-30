// =========================================
// Tipos para el Sistema de Comités IPUC
// =========================================
// Fecha: 30 Diciembre 2025
// Descripción: Interfaces TypeScript para el módulo de comités

import { Database } from '@/lib/database.types';

// =========================================
// Tipos base de la base de datos
// =========================================

export type ComiteRow = Database['public']['Tables']['comites']['Row'];
export type ComiteInsert = Database['public']['Tables']['comites']['Insert'];
export type ComiteUpdate = Database['public']['Tables']['comites']['Update'];

export type ComiteUsuarioRow = Database['public']['Tables']['comite_usuarios']['Row'];
export type ComiteUsuarioInsert = Database['public']['Tables']['comite_usuarios']['Insert'];
export type ComiteUsuarioUpdate = Database['public']['Tables']['comite_usuarios']['Update'];

export type ComiteMiembroRow = Database['public']['Tables']['comite_miembros']['Row'];
export type ComiteMiembroInsert = Database['public']['Tables']['comite_miembros']['Insert'];
export type ComiteMiembroUpdate = Database['public']['Tables']['comite_miembros']['Update'];

export type ComiteProyectoRow = Database['public']['Tables']['comite_proyectos']['Row'];
export type ComiteProyectoInsert = Database['public']['Tables']['comite_proyectos']['Insert'];
export type ComiteProyectoUpdate = Database['public']['Tables']['comite_proyectos']['Update'];

export type ComiteVotoRow = Database['public']['Tables']['comite_votos']['Row'];
export type ComiteVotoInsert = Database['public']['Tables']['comite_votos']['Insert'];
export type ComiteVotoUpdate = Database['public']['Tables']['comite_votos']['Update'];

export type ComitePagoRow = Database['public']['Tables']['comite_pagos']['Row'];
export type ComitePagoInsert = Database['public']['Tables']['comite_pagos']['Insert'];
export type ComitePagoUpdate = Database['public']['Tables']['comite_pagos']['Update'];

export type ComiteOfrendaRow = Database['public']['Tables']['comite_ofrendas']['Row'];
export type ComiteOfrendaInsert = Database['public']['Tables']['comite_ofrendas']['Insert'];
export type ComiteOfrendaUpdate = Database['public']['Tables']['comite_ofrendas']['Update'];

export type ComiteGastoRow = Database['public']['Tables']['comite_gastos']['Row'];
export type ComiteGastoInsert = Database['public']['Tables']['comite_gastos']['Insert'];
export type ComiteGastoUpdate = Database['public']['Tables']['comite_gastos']['Update'];

// =========================================
// Enums y Constantes
// =========================================

export const COMITE_ESTADOS = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
} as const;

export type ComiteEstado = typeof COMITE_ESTADOS[keyof typeof COMITE_ESTADOS];

export const COMITE_ROL = {
  LIDER: 'lider',
  TESORERO: 'tesorero',
  SECRETARIO: 'secretario',
} as const;

export type ComiteRol = typeof COMITE_ROL[keyof typeof COMITE_ROL];

export const PROYECTO_ESTADOS = {
  ACTIVO: 'activo',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
} as const;

export type ProyectoEstado = typeof PROYECTO_ESTADOS[keyof typeof PROYECTO_ESTADOS];

export const VOTO_ESTADOS = {
  ACTIVO: 'activo',
  COMPLETADO: 'completado',
  VENCIDO: 'vencido',
  CANCELADO: 'cancelado',
} as const;

export type VotoEstado = typeof VOTO_ESTADOS[keyof typeof VOTO_ESTADOS];

export const METODO_PAGO = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
  OTRO: 'otro',
} as const;

export type MetodoPago = typeof METODO_PAGO[keyof typeof METODO_PAGO];

export const TIPO_OFRENDA = {
  OFRENDA: 'ofrenda',
  DONACION: 'donacion',
  CULTO: 'culto',
  ACTIVIDAD: 'actividad',
  OTRO: 'otro',
} as const;

export type TipoOfrenda = typeof TIPO_OFRENDA[keyof typeof TIPO_OFRENDA];

// =========================================
// Interfaces extendidas con datos relacionados
// =========================================

/**
 * Comité con información del creador y estadísticas
 */
export interface Comite extends ComiteRow {
  usuario_creador?: {
    id: string;
    nombre: string;
    email: string;
  };
  estadisticas?: {
    total_usuarios: number;
    total_miembros: number;
    balance_actual: number;
  };
}

/**
 * Usuario de comité con información del usuario del sistema
 */
export interface ComiteUsuario extends ComiteUsuarioRow {
  usuario?: {
    id: string;
    nombre: string;
    email: string;
  };
  comite?: {
    id: string;
    nombre: string;
  };
}

/**
 * Proyecto con progreso calculado
 */
export interface ComiteProyecto extends ComiteProyectoRow {
  porcentaje_recaudado?: number;
  total_votos?: number;
  total_ofrendas?: number;
}

/**
 * Voto con información del miembro y pagos
 */
export interface ComiteVoto extends ComiteVotoRow {
  miembro?: {
    id: string;
    nombres: string;
    apellidos: string;
    telefono: string | null;
  };
  proyecto?: {
    id: string;
    nombre: string;
  };
  pagos?: ComitePagoRow[];
  porcentaje_pagado?: number;
  monto_pendiente?: number;
}

/**
 * Pago con información del voto
 */
export interface ComitePago extends ComitePagoRow {
  voto?: {
    id: string;
    concepto: string;
    monto_total: number;
    miembro?: {
      nombres: string;
      apellidos: string;
    };
  };
}

// =========================================
// DTOs (Data Transfer Objects)
// =========================================

/**
 * DTO para crear un nuevo comité
 */
export interface CreateComiteDTO {
  nombre: string;
  descripcion?: string;
  estado?: ComiteEstado;
}

/**
 * DTO para actualizar un comité
 */
export interface UpdateComiteDTO {
  nombre?: string;
  descripcion?: string;
  estado?: ComiteEstado;
}

/**
 * DTO para asignar un usuario a un comité
 */
export interface AsignarUsuarioComiteDTO {
  comite_id: string;
  usuario_id: string;
  rol: ComiteRol;
  fecha_ingreso?: string;
}

/**
 * DTO para crear un miembro del comité
 */
export interface CreateComiteMiembroDTO {
  comite_id: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  email?: string;
  fecha_ingreso?: string;
  estado?: ComiteEstado;
}

/**
 * DTO para crear un proyecto del comité
 */
export interface CreateComiteProyectoDTO {
  comite_id: string;
  nombre: string;
  descripcion?: string;
  monto_objetivo?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

/**
 * DTO para crear un voto
 */
export interface CreateComiteVotoDTO {
  comite_id: string;
  comite_miembro_id: string;
  proyecto_id?: string;
  concepto: string;
  monto_total: number;
  fecha_limite: string;
}

/**
 * DTO para registrar un pago
 */
export interface RegistrarPagoDTO {
  comite_voto_id: string;
  monto: number;
  fecha_pago?: string;
  metodo_pago?: MetodoPago;
  nota?: string;
}

/**
 * DTO para registrar una ofrenda
 */
export interface RegistrarOfrendaDTO {
  comite_id: string;
  proyecto_id?: string;
  concepto: string;
  monto: number;
  fecha?: string;
  tipo?: TipoOfrenda;
  nota?: string;
}

/**
 * DTO para registrar un gasto
 */
export interface RegistrarGastoDTO {
  comite_id: string;
  proyecto_id?: string;
  concepto: string;
  monto: number;
  fecha?: string;
  metodo_pago?: MetodoPago;
  comprobante?: string;
  nota?: string;
}

// =========================================
// Tipos de respuesta y resultados
// =========================================

/**
 * Balance del comité
 */
export interface BalanceComite {
  comite_id: string;
  total_ingresos: number;
  total_votos_recaudados: number;
  total_ofrendas: number;
  total_gastos: number;
  balance_actual: number;
  ultima_actualizacion: string;
}

/**
 * Estadísticas del comité
 */
export interface EstadisticasComite {
  total_proyectos: number;
  proyectos_activos: number;
  proyectos_completados: number;
  total_miembros: number;
  miembros_activos: number;
  total_votos: number;
  votos_activos: number;
  votos_completados: number;
  votos_vencidos: number;
  tasa_cumplimiento: number; // % de votos pagados
}

/**
 * Transacción reciente (para dashboard)
 */
export interface TransaccionReciente {
  id: string;
  tipo: 'pago' | 'ofrenda' | 'gasto';
  concepto: string;
  monto: number;
  fecha: string;
  icono?: string;
  color?: string;
}

/**
 * Dashboard del comité
 */
export interface DashboardComite {
  comite: Comite;
  balance: BalanceComite;
  estadisticas: EstadisticasComite;
  transacciones_recientes: TransaccionReciente[];
  votos_proximos_vencer: ComiteVoto[];
}

/**
 * Filtros para consultas
 */
export interface ComiteFiltros {
  estado?: ComiteEstado;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface VotosFiltros {
  comite_id: string;
  estado?: VotoEstado;
  miembro_id?: string;
  proyecto_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface ProyectosFiltros {
  comite_id: string;
  estado?: ProyectoEstado;
  search?: string;
}

// =========================================
// Tipos de resultado de operaciones
// =========================================

export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface OperationResultWithValidation<T = void> extends OperationResult<T> {
  validationErrors?: ValidationError[];
}
