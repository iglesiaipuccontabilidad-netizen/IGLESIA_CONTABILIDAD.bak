import { Database } from '@/lib/database.types'

// Re-exportar tipos de usuarios desde el archivo centralizado
export { 
  type UserRole, 
  type UserStatus, 
  type Usuario,
  type UsuarioRow,
  type UsuarioInsert,
  type UsuarioUpdate,
  type ActionResult,
  type EditarUsuarioData,
  ROLES_VALIDOS,
  ESTADOS_VALIDOS,
  isValidRole,
  isValidStatus,
  isValidEmail
} from './usuarios'

export type Tables = Database['public']['Tables']
export type TablaVotos = Tables['votos']['Row']
export type TablaMiembros = Tables['miembros']['Row']
export type TablaPagos = Tables['pagos']['Row']
export type TablaOrgUsuarios = Tables['organizacion_usuarios']['Row']
export type UpdateVoto = Tables['votos']['Update']
export type InsertPago = Tables['pagos']['Insert']
export type VotoUpdate = Tables['votos']['Update']
export type InsertOrgUsuario = Tables['organizacion_usuarios']['Insert']

// Legacy aliases
export type TablaUsuarios = TablaOrgUsuarios
export type InsertUsuario = InsertOrgUsuario

export type VotoBasico = Pick<TablaVotos, 'recaudado' | 'monto_total'>

export interface VotoConRelaciones extends TablaVotos {
  miembro: Pick<TablaMiembros, 'id' | 'nombres' | 'apellidos' | 'email'>
  pagos?: TablaPagos[]
}