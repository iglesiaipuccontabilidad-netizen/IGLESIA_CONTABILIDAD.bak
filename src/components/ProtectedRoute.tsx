import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export default async function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // ═══ JWT-first: leer rol desde app_metadata (Custom Access Token Hook) ═══
  const appMeta = user.app_metadata
  const orgMemberships = appMeta?.org_memberships as Array<{ org_id: string; role: string }> | undefined

  if (orgMemberships && orgMemberships.length > 0) {
    const membership = orgMemberships[0]
    if (membership.role === 'pendiente') {
      redirect('/login')
    }
    if (adminOnly && membership.role !== 'admin' && membership.role !== 'super_admin') {
      redirect('/dashboard')
    }
    return <>{children}</>
  }

  // ═══ Fallback: query organizacion_usuarios ═══
  const { data: orgUser } = await supabase
    .from('organizacion_usuarios')
    .select('rol, estado')
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .maybeSingle()

  if (!orgUser || orgUser.rol === 'pendiente') {
    redirect('/login')
  }

  if (adminOnly && orgUser.rol !== 'admin' && orgUser.rol !== 'super_admin') {
    redirect('/dashboard')
  }

  return <>{children}</>
}