'use client'

import { Menu } from 'lucide-react'
import styles from './DashboardHeader.module.css'
import LogoutButton from './LogoutButton'

interface DashboardHeaderProps {
  onMobileMenuClick: () => void
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMobileMenuClick }) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <button 
            onClick={onMobileMenuClick}
            className={styles.mobileMenuButton}
            aria-label="Abrir menú"
          >
            <Menu className={styles.menuIcon} />
          </button>
        </div>
        
        <div className={styles.rightSection}>
          <LogoutButton collapsed={false} />
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
