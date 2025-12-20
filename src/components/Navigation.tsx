'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from '../styles/navigation.module.css'

const navigationItems = [
  { 
    href: '/dashboard',
    label: 'Dashboard',
    icon: '/window.svg'
  },
  { 
    href: '/miembros',
    label: 'Miembros',
    icon: '/file.svg'
  },
  { 
    href: '/votos',
    label: 'Votos',
    icon: '/globe.svg'
  },
  { 
    href: '/pagos',
    label: 'Pagos',
    icon: '/next.svg'
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
            <img src={item.icon} alt="" width={24} height={24} />
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default Navigation