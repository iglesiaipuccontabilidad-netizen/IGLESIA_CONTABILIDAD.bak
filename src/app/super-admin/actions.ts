'use server'

import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Verifica si un usuario es super_admin
 */
export async function verificarSuperAdmin(userId: string): Promise<boolean> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('super_admins')
    .select('usuario_id')
    .eq('usuario_id', userId)
    .maybeSingle()

  return !!data
}

/**
 * Lista todas las organizaciones con filtros
 */
export async function listarOrganizaciones(filtro?: string) {
  const supabase = getServiceClient()

  let query = supabase
    .from('organizaciones')
    .select(`
      id, nombre, slug, plan, estado, max_usuarios, max_miembros,
      contacto, whatsapp, created_at, fecha_aprobacion, motivo_rechazo,
      onboarding_completo
    `)
    .order('created_at', { ascending: false })

  if (filtro && filtro !== 'todos') {
    query = query.eq('estado', filtro)
  }

  const { data, error } = await query

  if (error) return { success: false, error: error.message }
  return { success: true, data: data || [] }
}

/**
 * Obtiene estadísticas globales
 */
export async function obtenerEstadisticas() {
  const supabase = getServiceClient()

  const [orgsRes, usersRes, pendientesRes, activasRes] = await Promise.all([
    supabase.from('organizaciones').select('id', { count: 'exact', head: true }),
    supabase.from('organizacion_usuarios').select('id', { count: 'exact', head: true }),
    supabase.from('organizaciones').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('organizaciones').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
  ])

  return {
    total_orgs: orgsRes.count || 0,
    total_usuarios: usersRes.count || 0,
    pendientes: pendientesRes.count || 0,
    activas: activasRes.count || 0,
  }
}

/**
 * Obtiene detalle de una organización con sus miembros
 */
export async function obtenerDetalleOrg(orgId: string) {
  const supabase = getServiceClient()

  const [orgRes, membersRes] = await Promise.all([
    supabase
      .from('organizaciones')
      .select('*')
      .eq('id', orgId)
      .single(),
    supabase
      .from('organizacion_usuarios')
      .select(`
        id, rol, estado, created_at, usuario_id,
        usuarios!inner ( id, email )
      `)
      .eq('organizacion_id', orgId),
  ])

  if (orgRes.error) return { success: false, error: orgRes.error.message }

  return {
    success: true,
    org: orgRes.data,
    miembros: membersRes.data || [],
  }
}

/**
 * Aprobar una organización: pendiente → activo
 */
export async function aprobarOrganizacion(orgId: string, superAdminId: string) {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('organizaciones')
    .update({
      estado: 'activo',
      aprobado_por: superAdminId,
      fecha_aprobacion: new Date().toISOString(),
      motivo_rechazo: null,
    })
    .eq('id', orgId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Rechazar una organización
 */
export async function rechazarOrganizacion(orgId: string, motivo: string) {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('organizaciones')
    .update({
      estado: 'rechazado',
      motivo_rechazo: motivo || 'No cumple requisitos',
    })
    .eq('id', orgId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Suspender una organización activa
 */
export async function suspenderOrganizacion(orgId: string, motivo: string) {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('organizaciones')
    .update({
      estado: 'suspendido',
      motivo_rechazo: motivo || 'Suspendido por administrador',
    })
    .eq('id', orgId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Reactivar organización suspendida o rechazada → activo
 */
export async function reactivarOrganizacion(orgId: string, superAdminId: string) {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('organizaciones')
    .update({
      estado: 'activo',
      aprobado_por: superAdminId,
      fecha_aprobacion: new Date().toISOString(),
      motivo_rechazo: null,
    })
    .eq('id', orgId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Cambiar plan de una organización
 */
export async function cambiarPlanOrg(orgId: string, plan: string, maxUsuarios: number, maxMiembros: number) {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('organizaciones')
    .update({
      plan,
      max_usuarios: maxUsuarios,
      max_miembros: maxMiembros,
    })
    .eq('id', orgId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
