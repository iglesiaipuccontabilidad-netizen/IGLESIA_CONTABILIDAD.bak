'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import DashboardHeader from '@/components/DashboardHeader'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { useRefreshAuth } from '@/hooks/useRefreshAuth'
import { UserValidator } from '@/components/auth/UserValidator'
import styles from '@/app/dashboard/layout.module.css'

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 rounded-lg bg-white shadow-sm flex flex-col items-center gap-4">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <span className="text-sm text-gray-600">Cargando sistema...</span>
      </div>
    </div>
  )
}

function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  
  // TODOS los hooks deben estar ANTES de cualquier return condicional
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // Forzar refetch de la sesión si es necesario
  useRefreshAuth()

  console.log('🔍 [DashboardLayoutClient] Estado:', { 
    mounted, 
    isLoading, 
    hasUser: !!user,
    userEmail: user?.email,
    loadingTimeout
  })

  const handleMobileMenuToggle = () => {
    setIsMobileMenuVisible(prev => !prev)
  }

  useEffect(() => {
    console.log('🎬 [DashboardLayoutClient] Montando componente')
    setMounted(true)
    
    // Timeout de seguridad: si después de 20 segundos sigue cargando, mostrar timeout
    // Solo se ejecuta una vez al montar - NO depende de isLoading para evitar re-creación
    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true)
    }, 20000)
    
    return () => clearTimeout(timeoutId)
  }, [])

  // Resetear el timeout si el loading termina correctamente
  useEffect(() => {
    if (!isLoading && loadingTimeout) {
      setLoadingTimeout(false)
    }
  }, [isLoading, loadingTimeout])

  // Redirigir a login si no hay usuario después de que termine de cargar
  useEffect(() => {
    if (mounted && !isLoading && !user) {
      console.log('❌ [DashboardLayoutClient] No hay usuario autenticado, redirigiendo a login')
      router.replace('/login')
    }
  }, [user, isLoading, router, mounted])

  // AHORA sí, después de todos los hooks, hacer los returns condicionales
  // No renderizar nada hasta que el componente esté montado en el cliente
  if (!mounted) {
    console.log('⏳ [DashboardLayoutClient] Esperando montaje...')
    return null
  }

  // Si el loading tomó demasiado tiempo, mostrar opción de recargar
  if (loadingTimeout && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-6 rounded-lg bg-white shadow-sm flex flex-col items-center gap-4 text-center">
          <svg className="h-12 w-12 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-gray-700 font-medium">La carga está tomando más tiempo de lo esperado</p>
            <p className="text-sm text-gray-500 mt-1">Puede haber un problema de conexión</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Recargar página
          </button>
        </div>
      </div>
    )
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
      {/* Validador de usuario - detecta discrepancias */}
      <UserValidator />
      
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