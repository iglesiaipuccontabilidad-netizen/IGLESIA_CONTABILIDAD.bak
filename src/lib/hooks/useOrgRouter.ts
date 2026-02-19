'use client'

import { useRouter as useNextRouter } from 'next/navigation'

/**
 * Drop-in replacement for `next/navigation` useRouter.
 * Las URLs ya no llevan slug — se delega directamente al router de Next.js.
 *
 * ```tsx
 * import { useRouter } from '@/lib/hooks/useOrgRouter'
 * const router = useRouter()
 * router.push('/dashboard/votos')  // → /dashboard/votos
 * ```
 */
export function useRouter() {
  return useNextRouter()
}
