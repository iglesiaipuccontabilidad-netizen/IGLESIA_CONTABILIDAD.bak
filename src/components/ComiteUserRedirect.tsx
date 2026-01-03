'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'

export function ComiteUserRedirect() {
  // Componente desactivado - Los usuarios regulares ahora ven el dashboard
  // En lugar de ser redirigidos automáticamente a su primer comité
  return null
}
