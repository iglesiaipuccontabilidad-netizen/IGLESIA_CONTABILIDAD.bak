export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      comite_gastos: {
        Row: {
          comite_id: string
          comprobante: string | null
          concepto: string
          created_at: string
          fecha: string
          id: string
          metodo_pago: string
          monto: number
          nota: string | null
          proyecto_id: string | null
          registrado_por: string | null
        }
        Insert: {
          comite_id: string
          comprobante?: string | null
          concepto: string
          created_at?: string
          fecha: string
          id?: string
          metodo_pago?: string
          monto: number
          nota?: string | null
          proyecto_id?: string | null
          registrado_por?: string | null
        }
        Update: {
          comite_id?: string
          comprobante?: string | null
          concepto?: string
          created_at?: string
          fecha?: string
          id?: string
          metodo_pago?: string
          monto?: number
          nota?: string | null
          proyecto_id?: string | null
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comite_gastos_comite_id_fkey"
            columns: ["comite_id"]
            isOneToOne: false
            referencedRelation: "comites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_gastos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "comite_proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_gastos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comite_miembros: {
        Row: {
          apellidos: string
          comite_id: string
          created_at: string
          email: string | null
          estado: string
          fecha_ingreso: string
          id: string
          nombres: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          apellidos: string
          comite_id: string
          created_at?: string
          email?: string | null
          estado?: string
          fecha_ingreso?: string
          id?: string
          nombres: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          apellidos?: string
          comite_id?: string
          created_at?: string
          email?: string | null
          estado?: string
          fecha_ingreso?: string
          id?: string
          nombres?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comite_miembros_comite_id_fkey"
            columns: ["comite_id"]
            isOneToOne: false
            referencedRelation: "comites"
            referencedColumns: ["id"]
          },
        ]
      }
      comite_ofrendas: {
        Row: {
          comite_id: string
          concepto: string
          created_at: string
          fecha: string
          id: string
          monto: number
          nota: string | null
          proyecto_id: string | null
          registrado_por: string | null
          tipo: string
        }
        Insert: {
          comite_id: string
          concepto: string
          created_at?: string
          fecha: string
          id?: string
          monto: number
          nota?: string | null
          proyecto_id?: string | null
          registrado_por?: string | null
          tipo?: string
        }
        Update: {
          comite_id?: string
          concepto?: string
          created_at?: string
          fecha?: string
          id?: string
          monto?: number
          nota?: string | null
          proyecto_id?: string | null
          registrado_por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "comite_ofrendas_comite_id_fkey"
            columns: ["comite_id"]
            isOneToOne: false
            referencedRelation: "comites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_ofrendas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "comite_proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_ofrendas_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comite_pagos: {
        Row: {
          comite_voto_id: string
          created_at: string
          fecha_pago: string
          id: string
          metodo_pago: string
          monto: number
          nota: string | null
          registrado_por: string | null
        }
        Insert: {
          comite_voto_id: string
          created_at?: string
          fecha_pago: string
          id?: string
          metodo_pago?: string
          monto: number
          nota?: string | null
          registrado_por?: string | null
        }
        Update: {
          comite_voto_id?: string
          created_at?: string
          fecha_pago?: string
          id?: string
          metodo_pago?: string
          monto?: number
          nota?: string | null
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comite_pagos_comite_voto_id_fkey"
            columns: ["comite_voto_id"]
            isOneToOne: false
            referencedRelation: "comite_votos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_pagos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comite_proyectos: {
        Row: {
          comite_id: string
          creado_por: string | null
          created_at: string
          descripcion: string | null
          estado: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          monto_objetivo: number | null
          monto_recaudado: number
          nombre: string
          ultima_actualizacion_por: string | null
          updated_at: string
        }
        Insert: {
          comite_id: string
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          monto_objetivo?: number | null
          monto_recaudado?: number
          nombre: string
          ultima_actualizacion_por?: string | null
          updated_at?: string
        }
        Update: {
          comite_id?: string
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          monto_objetivo?: number | null
          monto_recaudado?: number
          nombre?: string
          ultima_actualizacion_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comite_proyectos_comite_id_fkey"
            columns: ["comite_id"]
            isOneToOne: false
            referencedRelation: "comites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_proyectos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_proyectos_ultima_actualizacion_por_fkey"
            columns: ["ultima_actualizacion_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comite_usuarios: {
        Row: {
          comite_id: string
          created_at: string
          estado: string
          fecha_ingreso: string
          id: string
          rol: string
          usuario_id: string
        }
        Insert: {
          comite_id: string
          created_at?: string
          estado?: string
          fecha_ingreso?: string
          id?: string
          rol: string
          usuario_id: string
        }
        Update: {
          comite_id?: string
          created_at?: string
          estado?: string
          fecha_ingreso?: string
          id?: string
          rol?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comite_usuarios_comite_id_fkey"
            columns: ["comite_id"]
            isOneToOne: false
            referencedRelation: "comites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_usuarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      proyecto_productos: {
        Row: {
          id: string
          proyecto_id: string
          nombre: string
          descripcion: string | null
          precio_unitario: number
          estado: string
          created_at: string
          updated_at: string
          creado_por: string | null
        }
        Insert: {
          id?: string
          proyecto_id: string
          nombre: string
          descripcion?: string | null
          precio_unitario: number
          estado?: string
          created_at?: string
          updated_at?: string
          creado_por?: string | null
        }
        Update: {
          id?: string
          proyecto_id?: string
          nombre?: string
          descripcion?: string | null
          precio_unitario?: number
          estado?: string
          created_at?: string
          updated_at?: string
          creado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_productos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "comite_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      proyecto_ventas: {
        Row: {
          id: string
          proyecto_id: string
          producto_id: string
          comprador_nombre: string
          comprador_telefono: string | null
          comprador_email: string | null
          comprador_notas: string | null
          cantidad: number
          precio_unitario: number
          valor_total: number
          monto_pagado: number
          saldo_pendiente: number
          estado: string
          fecha_venta: string
          created_at: string
          updated_at: string
          registrado_por: string | null
        }
        Insert: {
          id?: string
          proyecto_id: string
          producto_id: string
          comprador_nombre: string
          comprador_telefono?: string | null
          comprador_email?: string | null
          comprador_notas?: string | null
          cantidad: number
          precio_unitario: number
          valor_total: number
          monto_pagado?: number
          saldo_pendiente?: number
          estado?: string
          fecha_venta?: string
          created_at?: string
          updated_at?: string
          registrado_por?: string | null
        }
        Update: {
          id?: string
          proyecto_id?: string
          producto_id?: string
          comprador_nombre?: string
          comprador_telefono?: string | null
          comprador_email?: string | null
          comprador_notas?: string | null
          cantidad?: number
          precio_unitario?: number
          valor_total?: number
          monto_pagado?: number
          saldo_pendiente?: number
          estado?: string
          fecha_venta?: string
          created_at?: string
          updated_at?: string
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_ventas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "comite_proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_ventas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "proyecto_productos"
            referencedColumns: ["id"]
          },
        ]
      }
      proyecto_pagos_ventas: {
        Row: {
          id: string
          venta_id: string
          monto: number
          fecha_pago: string
          metodo_pago: string | null
          referencia: string | null
          notas: string | null
          created_at: string
          registrado_por: string | null
        }
        Insert: {
          id?: string
          venta_id: string
          monto: number
          fecha_pago?: string
          metodo_pago?: string | null
          referencia?: string | null
          notas?: string | null
          created_at?: string
          registrado_por?: string | null
        }
        Update: {
          id?: string
          venta_id?: string
          monto?: number
          fecha_pago?: string
          metodo_pago?: string | null
          referencia?: string | null
          notas?: string | null
          created_at?: string
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_pagos_ventas_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "proyecto_ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      comite_votos: {
        Row: {
          comite_id: string
          comite_miembro_id: string
          concepto: string
          creado_por: string | null
          created_at: string
          estado: string
          fecha_limite: string
          id: string
          monto_total: number
          proyecto_id: string | null
          recaudado: number
          ultima_actualizacion_por: string | null
          updated_at: string
        }
        Insert: {
          comite_id: string
          comite_miembro_id: string
          concepto: string
          creado_por?: string | null
          created_at?: string
          estado?: string
          fecha_limite: string
          id?: string
          monto_total: number
          proyecto_id?: string | null
          recaudado?: number
          ultima_actualizacion_por?: string | null
          updated_at?: string
        }
        Update: {
          comite_id?: string
          comite_miembro_id?: string
          concepto?: string
          creado_por?: string | null
          created_at?: string
          estado?: string
          fecha_limite?: string
          id?: string
          monto_total?: number
          proyecto_id?: string | null
          recaudado?: number
          ultima_actualizacion_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comite_votos_comite_id_fkey"
            columns: ["comite_id"]
            isOneToOne: false
            referencedRelation: "comites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_votos_comite_miembro_id_fkey"
            columns: ["comite_miembro_id"]
            isOneToOne: false
            referencedRelation: "comite_miembros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_votos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_votos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "comite_proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comite_votos_ultima_actualizacion_por_fkey"
            columns: ["ultima_actualizacion_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comites: {
        Row: {
          creado_por: string | null
          created_at: string
          descripcion: string | null
          estado: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comites_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      miembros: {
        Row: {
          apellidos: string
          created_at: string
          direccion: string | null
          email: string | null
          estado: string
          fecha_ingreso: string | null
          id: string
          nombres: string
          rol: string
          telefono: string | null
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          apellidos: string
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string
          fecha_ingreso?: string | null
          id?: string
          nombres: string
          rol?: string
          telefono?: string | null
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          apellidos?: string
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string
          fecha_ingreso?: string | null
          id?: string
          nombres?: string
          rol?: string
          telefono?: string | null
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "miembros_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          created_at: string
          fecha_pago: string
          id: string
          metodo_pago: string
          monto: number
          nota: string | null
          registrado_por: string
          voto_id: string
        }
        Insert: {
          created_at?: string
          fecha_pago: string
          id?: string
          metodo_pago?: string
          monto: number
          nota?: string | null
          registrado_por: string
          voto_id: string
        }
        Update: {
          created_at?: string
          fecha_pago?: string
          id?: string
          metodo_pago?: string
          monto?: number
          nota?: string | null
          registrado_por?: string
          voto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_voto_id_fkey"
            columns: ["voto_id"]
            isOneToOne: false
            referencedRelation: "votos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_backup_20251106: {
        Row: {
          created_at: string | null
          fecha_pago: string | null
          id: string | null
          metodo_pago: string | null
          monto: number | null
          nota: string | null
          registrado_por: string | null
          voto_id: string | null
        }
        Insert: {
          created_at?: string | null
          fecha_pago?: string | null
          id?: string | null
          metodo_pago?: string | null
          monto?: number | null
          nota?: string | null
          registrado_por?: string | null
          voto_id?: string | null
        }
        Update: {
          created_at?: string | null
          fecha_pago?: string | null
          id?: string | null
          metodo_pago?: string | null
          monto?: number | null
          nota?: string | null
          registrado_por?: string | null
          voto_id?: string | null
        }
        Relationships: []
      }
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
        Relationships: [
          {
            foreignKeyName: "propositos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propositos_ultima_actualizacion_por_fkey"
            columns: ["ultima_actualizacion_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string | null
          email: string | null
          estado: Database["public"]["Enums"]["estado_usuario"]
          id: string
          rol: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_usuario"]
          id: string
          rol?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_usuario"]
          id?: string
          rol?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      votos: {
        Row: {
          creado_por: string | null
          created_at: string
          estado: string
          fecha_limite: string
          id: string
          miembro_id: string
          monto_total: number
          proposito: string | null
          proposito_id: string
          recaudado: number
          ultima_actualizacion_por: string | null
          updated_at: string
        }
        Insert: {
          creado_por?: string | null
          created_at?: string
          estado?: string
          fecha_limite: string
          id?: string
          miembro_id: string
          monto_total: number
          proposito?: string | null
          proposito_id: string
          recaudado?: number
          ultima_actualizacion_por?: string | null
          updated_at?: string
        }
        Update: {
          creado_por?: string | null
          created_at?: string
          estado?: string
          fecha_limite?: string
          id?: string
          miembro_id?: string
          monto_total?: number
          proposito?: string | null
          proposito_id?: string
          recaudado?: number
          ultima_actualizacion_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_miembro_id_fkey"
            columns: ["miembro_id"]
            isOneToOne: false
            referencedRelation: "miembros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_proposito_id_fkey"
            columns: ["proposito_id"]
            isOneToOne: false
            referencedRelation: "propositos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_ultima_actualizacion_por_fkey"
            columns: ["ultima_actualizacion_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      votos_backup_20251106: {
        Row: {
          creado_por: string | null
          created_at: string | null
          estado: string | null
          fecha_limite: string | null
          id: string | null
          miembro_id: string | null
          monto_total: number | null
          proposito: string | null
          recaudado: number | null
          ultima_actualizacion_por: string | null
          updated_at: string | null
        }
        Insert: {
          creado_por?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_limite?: string | null
          id?: string | null
          miembro_id?: string | null
          monto_total?: number | null
          proposito?: string | null
          recaudado?: number | null
          ultima_actualizacion_por?: string | null
          updated_at?: string | null
        }
        Update: {
          creado_por?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_limite?: string | null
          id?: string | null
          miembro_id?: string | null
          monto_total?: number | null
          proposito?: string | null
          recaudado?: number | null
          ultima_actualizacion_por?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string | null
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean | null
          is_sso_user: boolean | null
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string | null
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean | null
          is_sso_user?: boolean | null
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string | null
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean | null
          is_sso_user?: boolean | null
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vista_resumen_ventas_proyecto: {
        Row: {
          proyecto_id: string | null
          proyecto_nombre: string | null
          total_ventas: number | null
          productos_distintos: number | null
          unidades_vendidas: number | null
          valor_total_ventas: number | null
          total_recaudado: number | null
          total_pendiente: number | null
          ventas_pagadas: number | null
          ventas_pendientes: number | null
        }
        Insert: {
          proyecto_id?: string | null
          proyecto_nombre?: string | null
          total_ventas?: number | null
          productos_distintos?: number | null
          unidades_vendidas?: number | null
          valor_total_ventas?: number | null
          total_recaudado?: number | null
          total_pendiente?: number | null
          ventas_pagadas?: number | null
          ventas_pendientes?: number | null
        }
        Update: {
          proyecto_id?: string | null
          proyecto_nombre?: string | null
          total_ventas?: number | null
          productos_distintos?: number | null
          unidades_vendidas?: number | null
          valor_total_ventas?: number | null
          total_recaudado?: number | null
          total_pendiente?: number | null
          ventas_pagadas?: number | null
          ventas_pendientes?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      actualizar_recaudado_voto: {
        Args: { nuevo_monto: number; usuario_id: string; voto_id: string }
        Returns: undefined
      }
      actualizar_votos_comite_vencidos: { Args: never; Returns: Json }
      actualizar_votos_vencidos: {
        Args: never
        Returns: {
          votos_actualizados: number
          votos_ids: string[]
        }[]
      }
      confirmar_usuario_por_email: {
        Args: { p_email: string }
        Returns: undefined
      }
      contar_votos_vencidos_pendientes: {
        Args: never
        Returns: {
          fecha_limite_mas_antigua: string
          ids_pendientes: string[]
          total_pendientes: number
        }[]
      }
      crear_miembro: {
        Args: {
          p_apellidos: string
          p_cedula: string
          p_email: string
          p_estado: string
          p_id: string
          p_nombres: string
          p_rol: string
          p_telefono: string
        }
        Returns: undefined
      }
      get_user_status: {
        Args: { user_id: string }
        Returns: {
          estado: string
          rol: string
        }[]
      }
      insert_usuario: {
        Args: { p_email: string; p_estado: string; p_id: string; p_rol: string }
        Returns: {
          created_at: string | null
          email: string | null
          estado: Database["public"]["Enums"]["estado_usuario"]
          id: string
          rol: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "usuarios"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      insertar_usuario: {
        Args: { p_email: string; p_estado: string; p_id: string; p_rol: string }
        Returns: {
          created_at: string | null
          email: string | null
          estado: Database["public"]["Enums"]["estado_usuario"]
          id: string
          rol: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "usuarios"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { uid: string }; Returns: boolean }
      is_admin_or_tesorero: { Args: { uid: string }; Returns: boolean }
      is_tesorero: { Args: { user_id: string }; Returns: boolean }
      obtener_balance_comite: { Args: { p_comite_id: string }; Returns: Json }
      obtener_estadisticas_dashboard: {
        Args: never
        Returns: {
          total_miembros: number
          total_recaudado: number
          total_votos: number
          votos_activos: number
          votos_completados: number
        }[]
      }
      registrar_miembro:
        | {
            Args: {
              p_apellidos: string
              p_cedula: string
              p_direccion: string
              p_email: string
              p_estado?: string
              p_fecha_nacimiento: string
              p_genero: string
              p_id: string
              p_nombres: string
              p_rol?: string
              p_telefono: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_apellidos: string
              p_cedula: string
              p_email: string
              p_estado?: string
              p_id: string
              p_nombres: string
              p_rol?: string
              p_telefono: string
            }
            Returns: {
              apellidos: string
              created_at: string
              direccion: string | null
              email: string | null
              estado: string
              fecha_ingreso: string | null
              id: string
              nombres: string
              rol: string
              telefono: string | null
              updated_at: string
              usuario_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "miembros"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_apellidos: string
              p_correo: string
              p_fecha_bautismo: string
              p_fecha_nacimiento: string
              p_nombre: string
              p_telefono: string
              p_usuario_id: string
            }
            Returns: {
              apellidos: string
              created_at: string
              direccion: string | null
              email: string | null
              estado: string
              fecha_ingreso: string | null
              id: string
              nombres: string
              rol: string
              telefono: string | null
              updated_at: string
              usuario_id: string | null
            }[]
            SetofOptions: {
              from: "*"
              to: "miembros"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      registrar_miembro_v2: {
        Args: {
          p_apellidos: string
          p_cedula: string
          p_email?: string
          p_id: string
          p_nombres: string
          p_telefono?: string
        }
        Returns: Json
      }
      registrar_pago:
        | {
            Args: {
              p_fecha_pago: string
              p_metodo_pago: string
              p_monto: number
              p_monto_total: number
              p_nota: string
              p_registrado_por: string
              p_voto_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_fecha_pago: string
              p_metodo_pago: string
              p_monto: number
              p_registrado_por: string
              p_voto_id: string
            }
            Returns: Json
          }
      registrar_pago_comite: {
        Args: {
          p_comite_voto_id: string
          p_fecha_pago: string
          p_metodo_pago: string
          p_monto: number
          p_nota?: string
          p_registrado_por?: string
        }
        Returns: Json
      }
      sync_existing_users: { Args: never; Returns: undefined }
    }
    Enums: {
      estado_usuario: "activo" | "inactivo" | "pendiente" | "suspendido"
    }
    CompositeTypes: {
      usuario_input: {
        p_id: string | null
        p_email: string | null
        p_rol: string | null
        p_estado: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_usuario: ["activo", "inactivo", "pendiente", "suspendido"],
    },
  },
} as const
