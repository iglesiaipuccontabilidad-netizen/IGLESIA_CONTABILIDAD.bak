export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          rol: 'admin' | 'usuario' | 'pendiente'
          estado: 'activo' | 'inactivo' | 'pendiente'
        }
        Insert: {
          id?: string
          email: string
          rol?: 'admin' | 'usuario' | 'pendiente'
          estado?: 'activo' | 'inactivo' | 'pendiente'
        }
        Update: {
          email?: string
          rol?: 'admin' | 'usuario' | 'pendiente'
          estado?: 'activo' | 'inactivo' | 'pendiente'
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
        }
        Insert: {
          id?: string
          nombres: string
          apellidos: string
          cedula: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          fecha_ingreso: string
        }
        Update: {
          nombres?: string
          apellidos?: string
          cedula?: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          fecha_ingreso?: string
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}