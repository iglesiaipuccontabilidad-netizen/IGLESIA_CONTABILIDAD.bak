'use client'

import { useRouter as useNextRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useOrgNavigation } from '@/lib/hooks/useOrgNavigation'

/**
 * Drop-in replacement for `next/navigation` useRouter that auto-prefixes
 * the org slug on push/replace for /dashboard/* routes.
 *
 * ```tsx
 * import { useRouter } from '@/lib/hooks/useOrgRouter'
 * const router = useRouter()
 * router.push('/dashboard/votos')  // → /<slug>/dashboard/votos
 * ```
 */
export function useRouter() {
  const nextRouter = useNextRouter()
  const { orgPath } = useOrgNavigation()

  return useMemo(() => {
    return {
      ...nextRouter,
      push(href: string, options?: Parameters<typeof nextRouter.push>[1]) {
        // Navigate to actual filesystem route; middleware handles slug URLs on refresh
        return nextRouter.push(href, options)
      },
      replace(href: string, options?: Parameters<typeof nextRouter.replace>[1]) {
        return nextRouter.replace(href, options)
      },
    }
  }, [nextRouter])
}
