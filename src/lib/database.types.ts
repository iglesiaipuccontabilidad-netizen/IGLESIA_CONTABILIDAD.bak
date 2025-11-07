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
      propositos: {
        Row: {
          creado_por: string | null
          created_at: string | null
          descripcion: string | null
          estado: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          monto_objetivo: number | null
          monto_recaudado: number
          nombre: string
          ultima_actualizacion_por: string | null
          updated_at: string | null
        }
        Insert: {
          creado_por?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          monto_objetivo?: number | null
          monto_recaudado?: number
          nombre: string
          ultima_actualizacion_por?: string | null
          updated_at?: string | null
        }
        Update: {
          creado_por?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          monto_objetivo?: number | null
          monto_recaudado?: number
          nombre?: string
          ultima_actualizacion_por?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          email: string | null
          created_at: string | null
          updated_at: string | null
          rol: string | null
          estado: Database['public']['Enums']['estado_usuario']
        }
        Insert: {
          id: string
          email?: string | null
          created_at?: string | null
          updated_at?: string | null
          rol?: string | null
          estado?: Database['public']['Enums']['estado_usuario']
        }
        Update: {
          id?: string
          email?: string | null
          created_at?: string | null
          updated_at?: string | null
          rol?: string | null
          estado?: Database['public']['Enums']['estado_usuario']
        }
        Relationships: []
      }
      miembros: {
        Row: {
          id: string
          nombres: string
          apellidos: string
          cedula: string | null
          telefono: string | null
          email: string | null
          direccion: string | null
          created_at: string
          updated_at: string
          fecha_ingreso: string | null
          usuario_id: string | null
          estado: string
          rol: string
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
          proposito_id: string | null
          monto_total: number
          recaudado: number
          fecha_limite: string
          estado: string
          created_at: string
          updated_at: string
          creado_por: string | null
          ultima_actualizacion_por: string | null
        }
        Insert: {
          id?: string
          miembro_id: string
          proposito: string
          proposito_id?: string | null
          monto_total: number
          recaudado?: number
          fecha_limite: string
          estado?: string
          created_at?: string
          updated_at?: string
          creado_por?: string | null
          ultima_actualizacion_por?: string | null
        }
        Update: {
          miembro_id?: string
          proposito?: string
          proposito_id?: string | null
          monto_total?: number
          recaudado?: number
          fecha_limite?: string
          estado?: string
          created_at?: string
          updated_at?: string
          creado_por?: string | null
          ultima_actualizacion_por?: string | null
        }
        Relationships: []
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
      estado_usuario: 'activo' | 'inactivo' | 'pendiente' | 'suspendido'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}