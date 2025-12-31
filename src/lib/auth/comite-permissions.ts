/**
 * Sistema de permisos y control de acceso para usuarios de comités
 * Gestiona la autorización y validación de acceso a recursos de comités
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type ComiteRol = 'lider' | 'tesorero' | 'secretario' | 'vocal'

export interface ComiteAccess {
  hasAccess: boolean
  isAdmin: boolean
  rolEnComite: ComiteRol | null
  userId: string
  comiteId: string
}

/**
 * Verifica si un usuario tiene acceso a un comité específico
 * Los admins y tesoreros globales tienen acceso total
 * Los usuarios de comité solo tienen acceso a su(s) comité(s) asignado(s)
 */
export async function verificarAccesoComite(
  comiteId: string
): Promise<ComiteAccess> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener rol del usuario
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    redirect('/login')
  }

  const isAdmin = userData.rol === 'admin' || userData.rol === 'tesorero'

  // Si es admin/tesorero, tiene acceso total
  if (isAdmin) {
    return {
      hasAccess: true,
      isAdmin: true,
      rolEnComite: null,
      userId: user.id,
      comiteId,
    }
  }

  // Verificar si el usuario pertenece al comité
  const { data: comiteUsuario, error: comiteError } = await supabase
    .from('comite_usuarios')
    .select('rol, estado')
    .eq('comite_id', comiteId)
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .single()

  if (comiteError || !comiteUsuario) {
    return {
      hasAccess: false,
      isAdmin: false,
      rolEnComite: null,
      userId: user.id,
      comiteId,
    }
  }

  return {
    hasAccess: true,
    isAdmin: false,
    rolEnComite: comiteUsuario.rol as ComiteRol,
    userId: user.id,
    comiteId,
  }
}

/**
 * Middleware que requiere acceso a un comité
 * Redirige si el usuario no tiene permisos
 */
export async function requireComiteAccess(
  comiteId: string
): Promise<ComiteAccess> {
  const access = await verificarAccesoComite(comiteId)

  if (!access.hasAccess) {
    redirect('/dashboard/sin-acceso')
  }

  return access
}

/**
 * Obtiene todos los comités a los que el usuario tiene acceso
 * Admins/tesoreros tienen acceso a todos
 * Usuarios regulares solo ven sus comités asignados
 */
export async function obtenerComitesUsuario() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Obtener rol del usuario
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

  // Si es admin, retornar todos los comités
  if (isAdmin) {
    const { data: comites } = await supabase
      .from('comites')
      .select('id, nombre, descripcion, estado')
      .eq('estado', 'activo')
      .order('nombre')

    return comites || []
  }

  // Para usuarios regulares, solo sus comités asignados
  const { data: comitesUsuario } = await supabase
    .from('comite_usuarios')
    .select(`
      rol,
      comites:comite_id (
        id,
        nombre,
        descripcion,
        estado
      )
    `)
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')

  if (!comitesUsuario) {
    return []
  }

  // Mapear a formato simple
  return comitesUsuario
    .map((cu: any) => ({
      ...cu.comites,
      rolEnComite: cu.rol,
    }))
    .filter((c: any) => c.id) // Filtrar nulls
}

/**
 * Verifica si un usuario es líder o tesorero de un comité
 * Estos roles tienen permisos de gestión
 */
export async function esGestorComite(comiteId: string): Promise<boolean> {
  const access = await verificarAccesoComite(comiteId)

  if (access.isAdmin) {
    return true
  }

  return (
    access.hasAccess &&
    (access.rolEnComite === 'lider' || access.rolEnComite === 'tesorero')
  )
}

/**
 * Obtiene el primer comité del usuario
 * Útil para redirecciones automáticas
 */
export async function obtenerPrimerComiteUsuario(): Promise<string | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: comiteUsuario } = await supabase
    .from('comite_usuarios')
    .select('comite_id')
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .limit(1)
    .single()

  return comiteUsuario?.comite_id || null
}
