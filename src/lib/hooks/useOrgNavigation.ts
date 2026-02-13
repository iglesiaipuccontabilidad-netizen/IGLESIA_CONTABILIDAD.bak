'use client'

import { useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useOrganization } from '@/lib/context/OrganizationContext'

/**
 * Hook para navegación con org-slug en la URL.
 *
 * Proporciona:
 * - orgSlug: slug de la organización activa
 * - orgPath(path): antepone /<slug> a un path (ej: orgPath('/dashboard/votos') → '/mi-iglesia/dashboard/votos')
 * - cleanPathname: pathname sin el slug (para matching de rutas activas)
 * - pathname: pathname original completo
 */
export function useOrgNavigation() {
  const { organization } = useOrganization()
  const pathname = usePathname()

  const orgSlug = organization?.slug || null

  /**
   * Antepone el slug de la organización a un path.
   * Si el slug no está disponible, devuelve el path original (fallback graceful).
   */
  const orgPath = useCallback(
    (path: string) => {
      if (!orgSlug) return path
      // Evitar doble prefijo
      if (path.startsWith(`/${orgSlug}/`) || path === `/${orgSlug}`) return path
      return `/${orgSlug}${path.startsWith('/') ? '' : '/'}${path}`
    },
    [orgSlug]
  )

  /**
   * Pathname limpio sin el prefijo de slug.
   * Ejemplo: '/mi-iglesia/dashboard/votos' → '/dashboard/votos'
   */
  const cleanPathname = useMemo(() => {
    if (!pathname || !orgSlug) return pathname || ''
    if (pathname.startsWith(`/${orgSlug}/`)) {
      return pathname.slice(orgSlug.length + 1)
    }
    if (pathname === `/${orgSlug}`) return '/dashboard'
    return pathname
  }, [pathname, orgSlug])

  return { orgSlug, orgPath, cleanPathname, pathname: pathname || '' }
}
