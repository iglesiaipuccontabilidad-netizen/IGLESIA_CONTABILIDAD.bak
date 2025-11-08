'use client'

import React from 'react'
import { Menu, X } from 'lucide-react'
import styles from '@/styles/mobile-header.module.css'
import { useAuth } from '@/lib/context/AuthContext'

interface MobileHeaderProps {
  onMenuToggle: () => void
  isMenuOpen: boolean
}

export default function MobileHeader({ onMenuToggle, isMenuOpen }: MobileHeaderProps) {
  const { member } = useAuth()

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo y título */}
        <div className={styles.brand}>
          <div className={styles.brandMark}>IPUC</div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Contabilidad</span>
            <span className={styles.brandSubtitle}>Gestión de votos</span>
          </div>
        </div>

        {/* Info del usuario y menú hamburguesa */}
        <div className={styles.actions}>
          {/* Avatar del usuario (solo en pantallas pequeñas) */}
          <div className={styles.userAvatar}>
            {member?.email?.slice(0, 2).toUpperCase() || 'IP'}
          </div>

          {/* Botón hamburguesa */}
          <button
            onClick={onMenuToggle}
            className={styles.menuButton}
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className={styles.menuIcon} />
            ) : (
              <Menu className={styles.menuIcon} />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
