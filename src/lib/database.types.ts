export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          rol: 'admin' | 'usuario' | 'pendiente' | 'tesorero'
          estado: 'activo' | 'inactivo' | 'pendiente'
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          rol: 'admin' | 'usuario' | 'pendiente' | 'tesorero'
          estado: 'activo' | 'inactivo' | 'pendiente'
        }
        Update: {
          email?: string
          rol?: 'admin' | 'usuario' | 'pendiente' | 'tesorero'
          estado?: 'activo' | 'inactivo' | 'pendiente'
        }
      }
      miembros: {
        Row: {
          id: string
          nombres: string
          apellidos: string
          cedula: string
          telefono: string | null
          email: string | null
          direccion: string | null
          created_at: string
          updated_at: string
          fecha_ingreso: string
          usuario_id: string | null
          estado: 'activo' | 'inactivo'
          rol: 'miembro' | 'admin' | 'tesorero'
        }
        Insert: {
          id?: string
          nombres: string
          apellidos: string
          cedula: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          created_at?: string
          updated_at?: string
          fecha_ingreso: string
          usuario_id?: string | null
          estado?: 'activo' | 'inactivo'
          rol?: 'miembro' | 'admin' | 'tesorero'
        }
        Update: {
          nombres?: string
          apellidos?: string
          cedula?: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          fecha_ingreso?: string
          usuario_id?: string | null
          estado?: 'activo' | 'inactivo'
          rol?: 'miembro' | 'admin' | 'tesorero'
        }
      }
      votos: {
        Row: {
          id: string
          miembro_id: string
          proposito: string
          monto_total: number
          recaudado: number
          fecha_limite: string
          estado: 'activo' | 'completado' | 'cancelado'
          created_at: string
          updated_at: string
          creado_por: string
          ultima_actualizacion_por: string
        }
        Insert: {
          id?: string
          miembro_id: string
          proposito: string
          monto_total: number
          recaudado?: number
          fecha_limite: string
          estado?: 'activo' | 'completado' | 'cancelado'
          creado_por: string
          ultima_actualizacion_por?: string
        }
        Update: {
          miembro_id?: string
          proposito?: string
          monto_total?: number
          recaudado?: number
          fecha_limite?: string
          estado?: 'activo' | 'completado' | 'cancelado'
          ultima_actualizacion_por?: string
        }
      }
      pagos: {
        Row: {
          id: string
          voto_id: string
          monto: number
          fecha_pago: string
          nota: string | null
          registrado_por: string
          created_at: string
        }
        Insert: {
          id?: string
          voto_id: string
          monto: number
          fecha_pago: string
          nota?: string | null
          registrado_por: string
        }
        Update: {
          voto_id?: string
          monto?: number
          fecha_pago?: string
          nota?: string | null
          registrado_por?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      registrar_pago: {
        Args: {
          p_voto_id: string
          p_monto: number
          p_fecha_pago: string
          p_metodo_pago: string
          p_nota: string | null
          p_registrado_por: string
          p_monto_total: number
        }
        Returns: {
          success: boolean
          recaudado: number
          estado: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}