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

  // 1. Intentar obtener rol desde organizacion_usuarios (multi-tenant)
  const { data: orgUser } = await supabase
    .from('organizacion_usuarios')
    .select('rol, estado')
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .maybeSingle()

  if (orgUser) {
    // Usuario encontrado en organizacion_usuarios
    if (orgUser.rol === 'pendiente') {
      redirect('/login')
    }
    if (adminOnly && orgUser.rol !== 'admin' && orgUser.rol !== 'super_admin') {
      redirect('/dashboard')
    }
    return <>{children}</>
  }

  // 2. Fallback: verificar en miembros (compatibilidad)
  const { data: member, error: memberError } = await supabase
    .from('miembros')
    .select('rol, estado')
    .eq('usuario_id', user.id)
    .maybeSingle()

  if (memberError || !member || member.estado !== 'activo' || member.rol === 'pendiente') {
    redirect('/login')
  }

  if (adminOnly && member.rol !== 'admin') {
    redirect('/dashboard')
  }

  return <>{children}</>
}