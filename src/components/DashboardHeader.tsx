'use client'

import { Menu } from 'lucide-react'
import styles from './DashboardHeader.module.css'

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
        {/* Aquí puedes agregar más elementos del header */}
      </div>
    </header>
  )
}

export default DashboardHeader
