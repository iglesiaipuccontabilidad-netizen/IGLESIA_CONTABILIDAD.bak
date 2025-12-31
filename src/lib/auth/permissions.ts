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

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('rol, id')
    .eq('id', user.id)
    .single()

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

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  return usuario?.rol || null
}
