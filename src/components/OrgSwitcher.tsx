'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check, Building2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { useAuth } from '@/lib/context/AuthContext'
import { useOrganization } from '@/lib/context/OrganizationContext'

interface OrgOption {
  id: string
  slug: string
  nombre: string
  plan: string
  rol: string
}

const rolLabels: Record<string, string> = {
  admin: 'Administrador',
  tesorero: 'Tesorero',
  usuario: 'Usuario',
  super_admin: 'Super Admin',
  pendiente: 'Pendiente',
}

/**
 * Selector de organización para usuarios multi-org.
 * Solo se muestra si el usuario pertenece a más de una organización.
 */
export function OrgSwitcher() {
  const { user } = useAuth()
  const { organization } = useOrganization()
  const [isOpen, setIsOpen] = useState(false)
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch all org memberships
  useEffect(() => {
    const fetchOrgs = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
          .from('organizacion_usuarios')
          .select('organizacion_id, rol, organizaciones!inner(id, slug, nombre, plan)')
          .eq('usuario_id', user.id)
          .eq('estado', 'activo')

        if (data && data.length > 0) {
          setOrgs(
            data.map((m: any) => ({
              id: m.organizaciones?.id || m.organizacion_id,
              slug: m.organizaciones?.slug || '',
              nombre: m.organizaciones?.nombre || 'Sin nombre',
              plan: m.organizaciones?.plan || 'gratuito',
              rol: m.rol,
            }))
          )
        }
      } catch (err) {
        console.warn('⚠️ [OrgSwitcher] Error al cargar organizaciones:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrgs()
  }, [user])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't show if still loading, no orgs, or only 1 org
  if (loading || orgs.length <= 1) return null

  const handleSwitch = async (org: OrgOption) => {
    if (org.id === organization?.id) {
      setIsOpen(false)
      return
    }
    // Set org cookie and reload — middleware will pick up the new org
    document.cookie = `__auth_org_id=v1:${org.id}:0; path=/; max-age=604800; SameSite=Lax`
    document.cookie = `__auth_org_slug=${org.slug}; path=/; max-age=604800; SameSite=Lax`
    setIsOpen(false)
    // Full reload to re-run middleware with the new org cookie
    window.location.href = '/dashboard'
  }

  return (
    <div ref={dropdownRef} className="relative mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">Cambiar organización</span>
        <ChevronDown
          className={`h-3 w-3 ml-auto flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSwitch(org)}
              className={`flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                org.id === organization?.id
                  ? 'bg-blue-50/70 text-blue-700'
                  : 'text-gray-700'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-xs">{org.nombre}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {rolLabels[org.rol] || org.rol}
                </div>
              </div>
              {org.id === organization?.id && (
                <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
