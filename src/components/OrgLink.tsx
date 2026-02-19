'use client'

import NextLink, { type LinkProps } from 'next/link'
import { forwardRef, type AnchorHTMLAttributes } from 'react'

type OrgLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps & { children?: React.ReactNode }

/**
 * Drop-in replacement for `next/link`.
 * Las URLs ya no llevan slug — se delega directamente a NextLink.
 *
 * ```tsx
 * import Link from '@/components/OrgLink'
 * <Link href="/dashboard/votos">Votos</Link>
 * // renders → /dashboard/votos
 * ```
 */
const OrgLink = forwardRef<HTMLAnchorElement, OrgLinkProps>(function OrgLink(
  { href, ...rest },
  ref
) {
  return <NextLink ref={ref} href={href} {...rest} />
})

export default OrgLink
