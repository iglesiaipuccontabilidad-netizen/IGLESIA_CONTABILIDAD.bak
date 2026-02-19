'use client'

import { useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useOrganization } from '@/lib/context/OrganizationContext'

/**
 * Hook para navegación con org-aware context.
 *
 * Proporciona:
 * - orgSlug: slug de la organización activa (para display, no para URLs)
 * - orgPath(path): devuelve el path tal cual (las URLs ya NO llevan slug)
 * - cleanPathname: igual que pathname (ya no hay slug que limpiar)
 * - pathname: pathname actual
 */
export function useOrgNavigation() {
  const { organization } = useOrganization()
  const pathname = usePathname()

  const orgSlug = organization?.slug || null

  /**
   * Devuelve el path tal cual. Las URLs ya no incluyen slug.
   * Se mantiene la firma para compatibilidad con código existente.
   */
  const orgPath = useCallback(
    (path: string) => path,
    []
  )

  // Ya no hay slug en la URL, pathname es limpio directamente
  const cleanPathname = pathname || ''

  return { orgSlug, orgPath, cleanPathname, pathname: pathname || '' }
}
