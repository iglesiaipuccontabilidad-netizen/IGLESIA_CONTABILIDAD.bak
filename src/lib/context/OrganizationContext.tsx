'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { getCookie } from '@/lib/utils/supabaseWithTimeout'
import { useAuth } from './AuthContext'

// Tipos para la organización
export type OrganizationPlan = 'gratuito' | 'semilla' | 'crecimiento' | 'cosecha'
export type OrganizationStatus = 'activo' | 'suspendido' | 'cancelado' | 'prueba'
export type OrgUserRole = 'super_admin' | 'admin' | 'tesorero' | 'usuario' | 'pendiente'

export type Organization = {
  id: string
  nombre: string
  slug: string
  plan: OrganizationPlan
  logo_url: string | null
  configuracion: Record<string, unknown>
  max_usuarios: number
  max_miembros: number
  max_comites: number
  estado: OrganizationStatus
  fecha_vencimiento_plan: string | null
  ciudad: string | null
  pais: string | null
  contacto_nombre: string | null
  contacto_email: string | null
  contacto_telefono: string | null
}

export type OrgMembership = {
  id: string
  organizacion_id: string
  usuario_id: string
  rol: OrgUserRole
  estado: string
}

type OrganizationContextType = {
  organization: Organization | null
  membership: OrgMembership | null
  isLoading: boolean
  orgRole: OrgUserRole | null
  isAdmin: boolean
  isTesorero: boolean
  isAdminOrTesorero: boolean
  refreshOrganization: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  membership: null,
  isLoading: true,
  orgRole: null,
  isAdmin: false,
  isTesorero: false,
  isAdminOrTesorero: false,
  refreshOrganization: async () => {},
})

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [membership, setMembership] = useState<OrgMembership | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)
  const supabaseRef = useRef(getSupabaseBrowserClient())

  const loadOrganization = useCallback(async (userId: string) => {
    try {
      // Read preferred org_id from cookie (set by middleware from URL slug)
      const preferredOrgId = getCookie('org_id')

      // Build query — filter by preferred org if available (multi-org support)
      const query = supabaseRef.current
        .from('organizacion_usuarios')
        .select('id, organizacion_id, usuario_id, rol, estado')
        .eq('usuario_id', userId)
        .eq('estado', 'activo')

      const { data: orgUser, error: orgUserError } = preferredOrgId
        ? await query.eq('organizacion_id', preferredOrgId).maybeSingle()
        : await query.limit(1).maybeSingle()

      if (orgUserError || !orgUser) {
        console.warn('⚠️ [OrgContext] Usuario sin organización activa:', orgUserError?.message)
        if (mountedRef.current) {
          setMembership(null)
          setOrganization(null)
          setIsLoading(false)
        }
        return
      }

      // 2. Obtener datos de la organización
      const { data: org, error: orgError } = await supabaseRef.current
        .from('organizaciones')
        .select('*')
        .eq('id', orgUser.organizacion_id)
        .single()

      if (orgError || !org) {
        console.error('❌ [OrgContext] Error cargando organización:', orgError?.message)
        if (mountedRef.current) {
          setMembership(orgUser as OrgMembership)
          setOrganization(null)
          setIsLoading(false)
        }
        return
      }

      if (mountedRef.current) {
        setMembership(orgUser as OrgMembership)
        setOrganization(org as Organization)
        console.log('✅ [OrgContext] Organización cargada:', org.nombre, '| Rol:', orgUser.rol)
      }
    } catch (err) {
      console.error('❌ [OrgContext] Error:', err)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const refreshOrganization = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    await loadOrganization(user.id)
  }, [user, loadOrganization])

  useEffect(() => {
    mountedRef.current = true

    if (user) {
      loadOrganization(user.id)
    } else {
      setOrganization(null)
      setMembership(null)
      setIsLoading(false)
    }

    return () => {
      mountedRef.current = false
    }
  }, [user, loadOrganization])

  // Calcular roles derivados
  const orgRole = membership?.rol as OrgUserRole | null
  const isAdmin = orgRole === 'admin' || orgRole === 'super_admin'
  const isTesorero = orgRole === 'tesorero'
  const isAdminOrTesorero = isAdmin || isTesorero

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        membership,
        isLoading,
        orgRole,
        isAdmin,
        isTesorero,
        isAdminOrTesorero,
        refreshOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

/**
 * Hook para acceder al contexto de organización.
 * Proporciona la organización actual, el rol del usuario y helpers booleanos.
 */
export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization debe usarse dentro de un OrganizationProvider')
  }
  return context
}
