/**
 * Tipos para gestión de usuarios
 * Basado en mejores prácticas de Supabase
 */

import { Database } from '@/lib/database.types'

// Tipos base de la BD
export type UsuarioRow = Database['public']['Tables']['usuarios']['Row']
export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert']
export type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update']

// Enums tipados para roles y estados
export type UserRole = 'admin' | 'tesorero' | 'usuario' | 'pendiente'
export type UserStatus = 'activo' | 'inactivo' | 'pendiente' | 'suspendido'

// Tipo extendido con tipado fuerte
export interface Usuario {
  id: string
  email: string | null
  rol: UserRole
  estado: UserStatus
  created_at: string | null
  updated_at: string | null
}

// Datos para editar usuario
export interface EditarUsuarioData {
  email: string
  rol: UserRole
  estado: UserStatus
}

// Datos para crear usuario
export interface CrearUsuarioData {
  email: string
  password: string
  rol: UserRole
}

// Respuesta de acciones
export interface ActionResult<T = unknown> {
  success: boolean
  error?: string
  data?: T
  message?: string
}

// Resultado de verificación de admin
export interface VerifyAdminResult {
  isAdmin: boolean
  currentUserId: string | null
  error?: string
  userData?: Pick<Usuario, 'rol' | 'estado'>
}

// Roles y estados válidos para validación
export const ROLES_VALIDOS: readonly UserRole[] = ['admin', 'tesorero', 'usuario', 'pendiente'] as const
export const ESTADOS_VALIDOS: readonly UserStatus[] = ['activo', 'inactivo', 'pendiente', 'suspendido'] as const

// Helper para validar rol
export function isValidRole(rol: unknown): rol is UserRole {
  return typeof rol === 'string' && ROLES_VALIDOS.includes(rol as UserRole)
}

// Helper para validar estado
export function isValidStatus(estado: unknown): estado is UserStatus {
  return typeof estado === 'string' && ESTADOS_VALIDOS.includes(estado as UserStatus)
}

// Regex para validación de email
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Helper para validar email
export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_REGEX.test(email)
}

// Regex para validación de contraseña (mínimo 6 caracteres)
export const PASSWORD_MIN_LENGTH = 6

// Helper para validar contraseña
export function isValidPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= PASSWORD_MIN_LENGTH
}

// Tipo para usuario con datos mínimos de verificación
export type UserVerificationData = Pick<Usuario, 'rol' | 'estado'>

// Permisos por rol
export const PERMISOS_POR_ROL: Record<UserRole, string[]> = {
  admin: ['usuarios.crear', 'usuarios.editar', 'usuarios.eliminar', 'miembros.crear', 'miembros.editar', 'miembros.eliminar', 'votos.crear', 'votos.editar', 'pagos.crear'],
  tesorero: ['miembros.crear', 'miembros.editar', 'votos.crear', 'votos.editar', 'pagos.crear'],
  usuario: ['votos.ver', 'miembros.ver'],
  pendiente: [],
}

// Helper para verificar permiso
export function tienePermiso(rol: UserRole, permiso: string): boolean {
  return PERMISOS_POR_ROL[rol]?.includes(permiso) ?? false
}
