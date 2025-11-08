'use client'

import { logout } from '@/app/login/actions'
import styles from '@/styles/logout-button.module.css'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  collapsed?: boolean
}

export default function LogoutButton({ collapsed }: LogoutButtonProps) {
  return (
    <form action={logout} className={styles.logoutForm}>
      <button
        type="submit"
        className={`${styles.logoutButton} ${collapsed ? styles.collapsed : ''}`}
        title="Cerrar Sesión"
      >
        <LogOut className={styles.icon} />
        {!collapsed && <span className={styles.text}>Cerrar Sesión</span>}
      </button>
    </form>
  )
}