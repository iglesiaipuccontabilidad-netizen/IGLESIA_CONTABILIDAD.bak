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
 * Valida un token de invitación y retorna los datos si es válido.
 */
export async function validarInvitacion(token: string) {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('invitaciones')
    .select(`
      id,
      email,
      rol,
      estado,
      expires_at,
      organizacion_id,
      organizaciones!inner ( nombre, slug )
    `)
    .eq('token', token)
    .single()

  if (error || !data) {
    return { valid: false, error: 'Invitación no encontrada' }
  }

  if (data.estado !== 'pendiente') {
    return { valid: false, error: 'Esta invitación ya fue usada o cancelada' }
  }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'Esta invitación ha expirado' }
  }

  const org = data.organizaciones as any

  return {
    valid: true,
    invitacion: {
      id: data.id,
      email: data.email,
      rol: data.rol,
      organizacion_id: data.organizacion_id,
      org_nombre: org?.nombre || 'Iglesia',
      org_slug: org?.slug || '',
    },
  }
}

/**
 * Acepta una invitación: crea usuario (si es nuevo) + membresía.
 */
export async function aceptarInvitacion(formData: FormData) {
  const token = formData.get('token') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombre = formData.get('nombre') as string

  if (!token || !email || !password || !nombre) {
    return { success: false, error: 'Todos los campos son obligatorios' }
  }

  if (password.length < 8) {
    return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  const supabase = getServiceClient()

  // 1. Validar token
  const validation = await validarInvitacion(token)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const inv = validation.invitacion!

  // Verificar que el email coincida
  if (email.toLowerCase() !== inv.email.toLowerCase()) {
    return { success: false, error: 'El email no coincide con la invitación' }
  }

  try {
    // 2. Verificar si el usuario ya existe en auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    )

    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Crear nuevo usuario
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre },
      })

      if (authError) {
        return { success: false, error: `Error creando usuario: ${authError.message}` }
      }

      userId = authData.user.id
    }

    // 3. Verificar que no tenga ya membresía en esta org
    const { data: existingMembership } = await supabase
      .from('organizacion_usuarios')
      .select('id')
      .eq('usuario_id', userId)
      .eq('organizacion_id', inv.organizacion_id)
      .maybeSingle()

    if (existingMembership) {
      // Ya es miembro, solo actualizar invitación
      await supabase
        .from('invitaciones')
        .update({ estado: 'aceptada' })
        .eq('token', token)

      return {
        success: true,
        slug: inv.org_slug,
        message: 'Ya eres miembro de esta organización',
      }
    }

    // 4. Crear membresía
    const { error: memberError } = await supabase
      .from('organizacion_usuarios')
      .insert({
        organizacion_id: inv.organizacion_id,
        usuario_id: userId,
        rol: inv.rol,
        estado: 'activo',
      })

    if (memberError) {
      return { success: false, error: `Error asignando membresía: ${memberError.message}` }
    }

    // 5. Marcar invitación como aceptada
    await supabase
      .from('invitaciones')
      .update({ estado: 'aceptada' })
      .eq('token', token)

    return {
      success: true,
      slug: inv.org_slug,
    }
  } catch (err: any) {
    console.error('Error aceptando invitación:', err)
    return { success: false, error: err.message || 'Error inesperado' }
  }
}
