'use server'

import { createClient } from '@supabase/supabase-js'
import { slugify } from '@/lib/utils/slugify'
import { seedOrganizacionDefaults } from '@/lib/seed/organizacion-defaults'
import { createActionClient } from '@/lib/supabase/server'

/**
 * Registra una nueva organización + usuario admin.
 * Usa service role para crear la org y membresía (bypasa RLS).
 */
export async function registrarOrganizacion(formData: FormData) {
  const nombreIglesia = formData.get('nombre_iglesia') as string
  const pastor = formData.get('pastor') as string
  const ciudad = formData.get('ciudad') as string
  const departamento = formData.get('departamento') as string
  const whatsapp = formData.get('whatsapp') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombreAdmin = formData.get('nombre_admin') as string

  // Validaciones básicas
  if (!nombreIglesia || !email || !password || !nombreAdmin) {
    return { success: false, error: 'Todos los campos obligatorios deben completarse' }
  }

  if (password.length < 8) {
    return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  // Service role client (bypasa RLS)
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    // 1. Generar slug único (via DB function)
    const { data: slugData, error: slugError } = await serviceClient
      .rpc('generate_unique_slug', { base_name: nombreIglesia })

    if (slugError) throw new Error(`Error generando slug: ${slugError.message}`)
    const slug = slugData as string

    // 2. Verificar que el email no esté en uso
    const { data: existingUsers } = await serviceClient.auth.admin.listUsers()
    const emailInUse = existingUsers?.users?.some(u => u.email === email)
    if (emailInUse) {
      return { success: false, error: 'Este email ya está registrado. Inicia sesión en su lugar.' }
    }

    // 3. Crear usuario en auth.users
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: { nombre: nombreAdmin }
    })

    if (authError) {
      return { success: false, error: `Error creando usuario: ${authError.message}` }
    }

    const userId = authData.user.id

    // 4. Crear organización
    const { data: org, error: orgError } = await serviceClient
      .from('organizaciones')
      .insert({
        nombre: nombreIglesia,
        slug,
        plan: 'gratuito',
        estado: 'pendiente',
        max_usuarios: 2,
        max_miembros: 50,
        onboarding_completo: false,
        whatsapp: whatsapp || '',
        contacto: {
          pastor: pastor || '',
          ciudad: ciudad || '',
          departamento: departamento || '',
          email: email,
          whatsapp: whatsapp || '',
        },
        personalizacion: {
          color_primario: '#3b82f6',
          color_secundario: '#1e40af',
        },
      })
      .select('id, slug')
      .single()

    if (orgError) {
      // Rollback: eliminar usuario auth creado
      await serviceClient.auth.admin.deleteUser(userId)
      return { success: false, error: `Error creando organización: ${orgError.message}` }
    }

    // 5. Crear membresía admin
    const { error: memberError } = await serviceClient
      .from('organizacion_usuarios')
      .insert({
        organizacion_id: org.id,
        usuario_id: userId,
        rol: 'admin',
        estado: 'activo',
      })

    if (memberError) {
      // Rollback
      await serviceClient.from('organizaciones').delete().eq('id', org.id)
      await serviceClient.auth.admin.deleteUser(userId)
      return { success: false, error: `Error asignando administrador: ${memberError.message}` }
    }

    // 6. Datos semilla
    await seedOrganizacionDefaults(serviceClient, org.id)

    return {
      success: true,
      slug: org.slug,
      orgId: org.id,
    }
  } catch (err: any) {
    console.error('Error en registrarOrganizacion:', err)
    return { success: false, error: err.message || 'Error inesperado al registrar' }
  }
}
