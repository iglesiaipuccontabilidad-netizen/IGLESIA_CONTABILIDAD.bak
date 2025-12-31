'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'

export function ComiteUserRedirect() {
  const router = useRouter()
  const { member, comitesUsuario, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (member?.rol === 'admin' || member?.rol === 'tesorero') return
    
    if (member?.rol === 'usuario' && comitesUsuario && comitesUsuario.length > 0) {
      router.push(`/dashboard/comites/${comitesUsuario[0].comite_id}/dashboard`)
    }
  }, [member, comitesUsuario, isLoading, router])

  return null
}
