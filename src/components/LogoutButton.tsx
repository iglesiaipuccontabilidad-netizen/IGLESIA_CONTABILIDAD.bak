'use client'

import { logout } from '@/app/login/actions'
import styles from '@/styles/sidebar.module.css'

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
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        {!collapsed && <span>Cerrar Sesión</span>}
      </button>
    </form>
  )
}