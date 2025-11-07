'use client'

import { logout } from '@/app/login/actions'
import styles from '@/styles/sidebar.module.css'
import { LogoutIcon } from './icons'

interface LogoutButtonProps {
  collapsed?: boolean
}

export default function LogoutButton({ collapsed }: LogoutButtonProps) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={styles.logoutButton}
        title="Cerrar Sesión"
      >
        <LogoutIcon className={styles.icon} />
        {!collapsed && <span>Cerrar Sesión</span>}
      </button>
    </form>
  )
}