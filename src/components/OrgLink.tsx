'use client'

import NextLink, { type LinkProps } from 'next/link'
import { forwardRef, type AnchorHTMLAttributes } from 'react'
import { useOrgNavigation } from '@/lib/hooks/useOrgNavigation'

type OrgLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps & { children?: React.ReactNode }

/**
 * Drop-in replacement for `next/link` that auto-prefixes the org slug.
 *
 * ```tsx
 * import Link from '@/components/OrgLink'
 * <Link href="/dashboard/votos">Votos</Link>
 * // renders → /<slug>/dashboard/votos
 * ```
 */
const OrgLink = forwardRef<HTMLAnchorElement, OrgLinkProps>(function OrgLink(
  { href, ...rest },
  ref
) {
  const { orgPath } = useOrgNavigation()

  // Use `as` for display URL (with slug) and `href` for actual filesystem route
  // This follows the Next.js docs pattern for proxy/rewrite scenarios
  const isDashboardRoute =
    typeof href === 'string'
      ? href.startsWith('/dashboard')
      : typeof href === 'object' && href.pathname?.startsWith('/dashboard')

  if (isDashboardRoute) {
    const displayUrl =
      typeof href === 'string'
        ? orgPath(href)
        : { ...href, pathname: orgPath(href.pathname!) }
    return <NextLink ref={ref} href={href} as={displayUrl} {...rest} />
  }

  return <NextLink ref={ref} href={href} {...rest} />
})

export default OrgLink
