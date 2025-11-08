'use client'

import { logout } from '@/app/login/actions'
import styles from '@/styles/logout-button.module.css'
import { LogOut } from 'lucide-react'

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
        <LogOut className="w-5 h-5" />
        {!collapsed && <span>Cerrar Sesión</span>}
      </button>
    </form>
  )
}