'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from '../styles/navigation.module.css'

import { DashboardIcon, MembersIcon, VotosIcon, PagosIcon } from './icons'

const navigationItems = [
  { 
    href: '/dashboard',
    label: 'Dashboard',
    Icon: DashboardIcon
  },
  { 
    href: '/miembros',
    label: 'Miembros',
    Icon: MembersIcon
  },
  { 
    href: '/votos',
    label: 'Votos',
    Icon: VotosIcon
  },
  { 
    href: '/pagos',
    label: 'Pagos',
    Icon: PagosIcon
  }
]

const Navigation = () => {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path
    }
    return pathname?.startsWith(path)
  }

  return (
    <nav className={styles.mainNav}>
      {navigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`}
        >
          <span className={styles.icon}>
            <item.Icon className="w-6 h-6" />
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default Navigation