"use client"

import { useEffect, ComponentType } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/AuthContext"

interface WithComiteAccessOptions {
  requireAdmin?: boolean
  allowedRoles?: Array<'lider' | 'tesorero' | 'secretario' | 'vocal'>
  redirectTo?: string
}

/**
 * HOC para proteger componentes que requieren acceso a un comité específico
 * 
 * @param Component - Componente a proteger
 * @param options - Opciones de configuración
 * @returns Componente protegido
 * 
 * @example
 * ```tsx
 * // Permitir solo admin o tesorero del comité
 * export default withComiteAccess(MiComponente, {
 *   allowedRoles: ['lider', 'tesorero']
 * })
 * 
 * // Requerir admin
 * export default withComiteAccess(MiComponente, {
 *   requireAdmin: true
 * })
 * ```
 */
export function withComiteAccess<P extends object>(
  Component: ComponentType<P>,
  options: WithComiteAccessOptions = {}
) {
  const {
    requireAdmin = false,
    allowedRoles,
    redirectTo = '/dashboard/comites'
  } = options

  return function WithComiteAccessComponent(props: P) {
    const router = useRouter()
    const { member, isLoading } = useAuth()

    useEffect(() => {
      // Esperar a que termine de cargar
      if (isLoading) return

      // Si no hay usuario autenticado, redirigir al login
      if (!member) {
        router.push('/login')
        return
      }

      // Si se requiere admin y no lo es, bloquear
      if (requireAdmin && member.rol !== 'admin' && member.rol !== 'tesorero') {
        router.push(redirectTo)
        return
      }

      // TODO: Verificar roles específicos del comité cuando esté disponible
      // Por ahora, solo validamos el rol general del usuario
    }, [member, isLoading, router])

    // Mostrar loading mientras se verifica
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )
    }

    // Si no está autenticado, no renderizar nada (ya se redirigió)
    if (!member) {
      return null
    }

    // Si requiere admin y no lo es, no renderizar
    if (requireAdmin && member.rol !== 'admin' && member.rol !== 'tesorero') {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
            No tienes permisos suficientes para acceder a esta sección.
          </div>
        </div>
      )
    }

    // Renderizar el componente protegido
    return <Component {...props} />
  }
}
