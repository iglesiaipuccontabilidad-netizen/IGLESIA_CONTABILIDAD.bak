'use client'

import { Menu } from 'lucide-react'
import styles from './DashboardHeader.module.css'
import { useEffect, useState } from 'react'

interface DashboardHeaderProps {
  onMobileMenuClick: () => void
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMobileMenuClick }) => {
  return (
    <header className={styles.header}>
      <button 
        onClick={onMobileMenuClick}
        className={styles.mobileMenuButton}
        aria-label="Abrir menú"
      >
        <Menu className={styles.menuIcon} />
      </button>
      <div className={styles.headerContent}>
        <div className={styles.logoSection}>
          <img
            src="/LogoIpuc.png"
            alt="Logo IPUC"
            className={styles.ipucLogo}
          />
          <div className={styles.headerTitle}>
            Sistema de Votos IPUC
          </div>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
