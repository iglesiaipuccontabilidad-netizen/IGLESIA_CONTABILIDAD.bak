'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'
import { verificarSuperAdmin } from './actions'
import { Shield, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const isSA = await verificarSuperAdmin(user.id)
      if (!isSA) {
        router.push('/dashboard')
        return
      }
      setAuthorized(true)
    }
    check()
  }, [router])

  if (authorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Super Admin</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Panel de administración global</p>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <Link
              href="/super-admin"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition dark:text-slate-400 dark:hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/super-admin/organizaciones"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition dark:text-slate-400 dark:hover:text-white"
            >
              Organizaciones
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
            >
              ← Volver al dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
