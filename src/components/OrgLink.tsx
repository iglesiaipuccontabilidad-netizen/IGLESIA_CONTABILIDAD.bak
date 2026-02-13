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

  // Only prefix string hrefs that start with /dashboard
  const resolvedHref =
    typeof href === 'string' && href.startsWith('/dashboard')
      ? orgPath(href)
      : typeof href === 'object' &&
          href.pathname?.startsWith('/dashboard')
        ? { ...href, pathname: orgPath(href.pathname) }
        : href

  return <NextLink ref={ref} href={resolvedHref} {...rest} />
})

export default OrgLink
