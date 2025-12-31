'use client'

import { logout } from '@/app/login/actions'

interface LogoutButtonProps {
  collapsed?: boolean
}

export default function LogoutButton({ collapsed }: LogoutButtonProps) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 border border-red-200 hover:border-red-300"
        title="Cerrar Sesión"
        aria-label="Cerrar Sesión"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        >
          <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {!collapsed && <span>Cerrar Sesión</span>}
      </button>
    </form>
  )
}
