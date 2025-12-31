'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'

export function ComiteUserRedirect() {
  const router = useRouter()
  const { member, comitesUsuario, isLoading } = useAuth()

  useEffect(() => {
    console.log('🔀 ComiteUserRedirect - Estado:', {
      isLoading,
      memberRol: member?.rol,
      comitesCount: comitesUsuario?.length || 0,
      comites: comitesUsuario
    })
    
    // No hacer nada si está cargando
    if (isLoading) {
      console.log('⏳ Esperando a que termine de cargar...')
      return
    }
    
    // Si el usuario es admin o tesorero, no redirigir
    if (member?.rol === 'admin' || member?.rol === 'tesorero') {
      console.log('✅ Usuario admin/tesorero - No redirigir')
      return
    }
    
    // Si es usuario normal y tiene comités, redirigir al primero
    if (member?.rol === 'usuario' && comitesUsuario && comitesUsuario.length > 0) {
      console.log('🔀 Redirigiendo usuario de comité a su dashboard:', comitesUsuario[0].comite_id)
      router.push(`/dashboard/comites/${comitesUsuario[0].comite_id}/dashboard`)
    } else {
      console.log('❌ No se redirige - Rol:', member?.rol, 'Comités:', comitesUsuario?.length || 0)
    }
  }, [member, comitesUsuario, isLoading, router])

  return null
}
