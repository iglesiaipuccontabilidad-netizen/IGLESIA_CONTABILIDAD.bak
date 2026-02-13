import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Verifica que el usuario tenga permisos de admin o tesorero general
 * Si no los tiene, redirige a su comité o a una página de error
 */
export async function requireAdminOrTesorero() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // MULTI-TENANT: Consultar organizacion_usuarios primero
  let { data: usuario, error } = await supabase
    .from('organizacion_usuarios')
    .select('rol, usuario_id')
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .maybeSingle() as { data: { rol: string; usuario_id: string } | null; error: any }
  
  // Fallback a tabla usuarios
  if (!usuario && !error) {
    const fallback = await supabase
      .from('usuarios')
      .select('rol, id')
      .eq('id', user.id)
      .single()
    usuario = fallback.data ? { rol: fallback.data.rol, usuario_id: fallback.data.id } : null
    error = fallback.error
  }

  if (error || !usuario) {
    redirect('/login')
  }

  // Si es admin o tesorero, permitir acceso
  if (usuario.rol === 'admin' || usuario.rol === 'tesorero') {
    return { user, usuario }
  }

  // Si no es admin/tesorero, buscar su comité
  const { data: comites } = await supabase
    .from('comite_usuarios')
    .select('comite_id')
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .limit(1)

  if (comites && comites.length > 0) {
    redirect(`/dashboard/comites/${comites[0].comite_id}`)
  }

  // Si no tiene comités ni permisos, redirigir a página de sin acceso
  redirect('/dashboard/sin-acceso')
}

/**
 * Obtiene el rol del usuario sin hacer redirect
 */
export async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // MULTI-TENANT: Consultar organizacion_usuarios primero
  const { data: orgUser } = await supabase
    .from('organizacion_usuarios')
    .select('rol')
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .maybeSingle()
  
  if (orgUser?.rol) return orgUser.rol
  
  // Fallback a tabla usuarios
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  return usuario?.rol || null
}
