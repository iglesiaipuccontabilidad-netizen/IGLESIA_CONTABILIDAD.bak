import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Inserta datos semilla para una nueva organización.
 * Se ejecuta con service role (bypasa RLS).
 */
export async function seedOrganizacionDefaults(
  client: SupabaseClient,
  orgId: string
) {
  // Propósito inicial
  const { error: propError } = await client.from('propositos').insert({
    organizacion_id: orgId,
    nombre: 'Ofrenda General',
    descripcion: 'Propósito general para ofrendas y diezmos de la congregación',
    meta: 0,
    estado: 'activo',
  })

  if (propError) {
    console.error('Error creando propósito seed:', propError.message)
  }
}
