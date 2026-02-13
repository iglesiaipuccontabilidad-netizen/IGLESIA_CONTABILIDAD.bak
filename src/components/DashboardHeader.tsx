'use client'

import { Menu } from 'lucide-react'
import { useOrganization } from '@/lib/context/OrganizationContext'
import styles from './DashboardHeader.module.css'

interface DashboardHeaderProps {
  onMobileMenuClick: () => void
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMobileMenuClick }) => {
  const { organization, orgRole } = useOrganization()

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
          {organization && (
            <span className={styles.headerTitle}>
              {organization.nombre}
            </span>
          )}
        </div>
        <div className={styles.rightContent}>
          {orgRole && (
            <span className={styles.userRole}>
              {orgRole === 'admin' ? 'Administrador' : 
               orgRole === 'tesorero' ? 'Tesorero' : 
               orgRole === 'super_admin' ? 'Super Admin' : 'Usuario'}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader

