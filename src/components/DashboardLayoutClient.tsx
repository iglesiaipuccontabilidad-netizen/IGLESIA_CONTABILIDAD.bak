'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import DashboardHeader from '@/components/DashboardHeader'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useRefreshAuth } from '@/hooks/useRefreshAuth'
import styles from '@/app/dashboard/layout.module.css'

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-4 rounded-lg bg-gray-50 flex items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <span className="text-sm text-gray-600">Cargando...</span>
      </div>
    </div>
  )
}

function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  console.log('🔍 [DashboardLayoutClient] Estado:', { 
    mounted, 
    isLoading, 
    hasUser: !!user,
    userEmail: user?.email 
  })

  // Forzar refetch de la sesión si es necesario
  useRefreshAuth()

  const handleMobileMenuToggle = () => {
    setIsMobileMenuVisible(prev => !prev)
  }

  useEffect(() => {
    console.log('🎬 [DashboardLayoutClient] Montando componente')
    setMounted(true)
  }, [])

  // Redirigir a login si no hay usuario después de que termine de cargar
  useEffect(() => {
    if (mounted && !isLoading && !user) {
      console.log('❌ [DashboardLayoutClient] No hay usuario autenticado, redirigiendo a login')
      router.replace('/login')
    }
  }, [user, isLoading, router, mounted])

  // Renderizado condicional después de todos los hooks
  // No renderizar nada hasta que el componente esté montado en el cliente
  if (!mounted) {
    console.log('⏳ [DashboardLayoutClient] Esperando montaje...')
    return null
  }

  // Mostrar loading mientras carga
  if (isLoading) {
    console.log('⏳ [DashboardLayoutClient] Mostrando loading...')
    return <LoadingFallback />
  }

  // Si no hay usuario, no mostrar nada (se redirigirá en el useEffect)
  if (!user) {
    console.log('⚠️ [DashboardLayoutClient] Sin usuario, esperando redirección...')
    return null
  }

  console.log('✅ [DashboardLayoutClient] Renderizando dashboard completo')

  // Renderizar el dashboard completo
  return (
    <div className={styles.dashboardLayout}>
      <Sidebar 
        isMobileMenuVisible={isMobileMenuVisible} 
        onMobileMenuClose={() => setIsMobileMenuVisible(false)} 
      />
      <div className={styles.mainContent}>
        <DashboardHeader onMobileMenuClick={handleMobileMenuToggle} />
        <main className={styles.contentWrapper}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayoutClient