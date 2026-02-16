'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Herramienta de debugging para verificar acceso de usuarios a comités
 * ELIMINAR DESPUÉS DE DEBUGGING
 */
export async function debugComiteAccess(userEmail: string, comiteName: string) {
  try {
    const supabase = await createClient()
    
    // 1. Buscar usuario
    const { data: usuario, error: userError } = await supabase
      .from('organizacion_usuarios')
      .select('usuario_id, rol, estado')
      .eq('usuario_id', userEmail)
      .eq('estado', 'activo')
      .maybeSingle()
    
    console.log('👤 Usuario encontrado:', usuario)
    
    if (userError || !usuario) {
      return { 
        success: false, 
        error: 'Usuario no encontrado',
        details: { userError }
      }
    }
    
    // 2. Buscar comité
    const { data: comite, error: comiteError } = await supabase
      .from('comites')
      .select('id, nombre, estado')
      .ilike('nombre', `%${comiteName}%`)
      .single()
    
    console.log('🏢 Comité encontrado:', comite)
    
    if (comiteError || !comite) {
      return {
        success: false,
        error: 'Comité no encontrado',
        details: { comiteError }
      }
    }
    
    // 3. Verificar si existe la asignación
    const { data: asignacion, error: asignacionError } = await supabase
      .from('comite_usuarios')
      .select('*')
      .eq('usuario_id', usuario.usuario_id)
      .eq('comite_id', comite.id)
      .maybeSingle()
    
    console.log('📋 Asignación existente:', asignacion)
    
    if (asignacion) {
      return {
        success: true,
        message: 'Usuario ya tiene acceso al comité',
        data: {
          usuario,
          comite,
          asignacion
        }
      }
    }
    
    // 4. Crear la asignación si no existe
    console.log('➕ Creando nueva asignación...')
    
    const { data: nuevaAsignacion, error: createError } = await supabase
      .from('comite_usuarios')
      .insert({
        usuario_id: usuario.usuario_id,
        comite_id: comite.id,
        rol: 'lider',
        estado: 'activo',
        fecha_ingreso: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error al crear asignación:', createError)
      return {
        success: false,
        error: 'Error al crear asignación',
        details: { createError }
      }
    }
    
    console.log('✅ Asignación creada:', nuevaAsignacion)
    
    return {
      success: true,
      message: 'Asignación creada exitosamente',
      data: {
        usuario,
        comite,
        asignacion: nuevaAsignacion
      }
    }
    
  } catch (error) {
    console.error('❌ Error en debugComiteAccess:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
