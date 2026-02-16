'use server'

import { createClient } from '@supabase/supabase-js'
import { createActionClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Obtiene la configuración de una organización por ID
 */
export async function obtenerConfigOrg(orgId: string) {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('organizaciones')
    .select('id, nombre, slug, plan, estado, max_usuarios, max_miembros, contacto, personalizacion, onboarding_completo')
    .eq('id', orgId)
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

/**
 * Actualiza datos generales de la organización
 */
export async function actualizarOrg(formData: FormData) {
  const orgId = formData.get('org_id') as string
  const nombre = formData.get('nombre') as string
  const pastor = formData.get('pastor') as string
  const ciudad = formData.get('ciudad') as string
  const departamento = formData.get('departamento') as string
  const email = formData.get('email_contacto') as string

  if (!orgId || !nombre) {
    return { success: false, error: 'El nombre es obligatorio' }
  }

  const supabase = getServiceClient()

  const { error } = await supabase
    .from('organizaciones')
    .update({
      nombre,
      contacto: { pastor, ciudad, departamento, email },
    })
    .eq('id', orgId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Actualiza colores de personalización
 */
export async function actualizarPersonalizacion(formData: FormData) {
  const orgId = formData.get('org_id') as string
  const colorPrimario = formData.get('color_primario') as string
  const colorSecundario = formData.get('color_secundario') as string

  if (!orgId) return { success: false, error: 'Org ID requerido' }

  const supabase = getServiceClient()

  const { error } = await supabase
    .from('organizaciones')
    .update({
      personalizacion: {
        color_primario: colorPrimario || '#3b82f6',
        color_secundario: colorSecundario || '#1e40af',
      },
    })
    .eq('id', orgId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Lista invitaciones pendientes de una organización
 */
export async function listarInvitaciones(orgId: string) {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('invitaciones')
    .select('id, email, rol, estado, created_at, expires_at')
    .eq('organizacion_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data || [] }
}

/**
 * Lista miembros actuales de la organización
 */
export async function listarMiembros(orgId: string) {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('organizacion_usuarios')
    .select(`
      id,
      rol,
      estado,
      created_at,
      usuario_id,
      usuarios!inner ( id, email )
    `)
    .eq('organizacion_id', orgId)
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data || [] }
}

/**
 * Envía una invitación (crea registro + genera token)
 */
export async function enviarInvitacion(formData: FormData) {
  const orgId = formData.get('org_id') as string
  const email = formData.get('email') as string
  const rol = formData.get('rol') as string
  const invitadoPor = formData.get('invitado_por') as string

  if (!orgId || !email || !rol) {
    return { success: false, error: 'Email y rol son obligatorios' }
  }

  const supabase = getServiceClient()

  // Verificar límite de usuarios
  const { data: org } = await supabase
    .from('organizaciones')
    .select('max_usuarios')
    .eq('id', orgId)
    .single()

  const { count: currentMembers } = await supabase
    .from('organizacion_usuarios')
    .select('id', { count: 'exact', head: true })
    .eq('organizacion_id', orgId)

  if (org && currentMembers !== null && currentMembers >= (org.max_usuarios || 2)) {
    return {
      success: false,
      error: `Has alcanzado el límite de ${org.max_usuarios} usuarios. Actualiza tu plan para invitar más.`,
    }
  }

  // Verificar que no exista invitación pendiente para ese email
  const { data: existing } = await supabase
    .from('invitaciones')
    .select('id')
    .eq('organizacion_id', orgId)
    .eq('email', email.toLowerCase())
    .eq('estado', 'pendiente')
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Ya existe una invitación pendiente para este email' }
  }

  // Crear invitación
  const token = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expira en 7 días

  const { data: inv, error } = await supabase
    .from('invitaciones')
    .insert({
      organizacion_id: orgId,
      email: email.toLowerCase(),
      rol,
      token,
      estado: 'pendiente',
      invitado_por: invitadoPor || null,
      expires_at: expiresAt.toISOString(),
    })
    .select('id, token')
    .single()

  if (error) return { success: false, error: error.message }

  // TODO: Fase 3 - Enviar email via Edge Function + Resend
  // Por ahora solo generamos el link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const invitationLink = `${baseUrl}/invitacion/${token}`

  // Intentar enviar email (no bloquea si falla)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    await fetch(`${supabaseUrl}/functions/v1/send-invitation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        org_nombre: (await supabase.from('organizaciones').select('nombre').eq('id', orgId).single()).data?.nombre || 'Iglesia',
        rol,
        invitation_link: invitationLink,
      }),
    })
  } catch (emailErr) {
    console.warn('No se pudo enviar email de invitación:', emailErr)
  }

  return {
    success: true,
    link: invitationLink,
    message: `Invitación creada. Comparte este enlace: ${invitationLink}`,
  }
}

/**
 * Cancela una invitación
 */
export async function cancelarInvitacion(invitacionId: string) {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('invitaciones')
    .update({ estado: 'cancelada' })
    .eq('id', invitacionId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Cambia el rol de un miembro
 */
export async function cambiarRolMiembro(membershipId: string, nuevoRol: string) {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('organizacion_usuarios')
    .update({ rol: nuevoRol })
    .eq('id', membershipId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Elimina un miembro de la organización
 */
export async function eliminarMiembro(membershipId: string) {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('organizacion_usuarios')
    .delete()
    .eq('id', membershipId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
