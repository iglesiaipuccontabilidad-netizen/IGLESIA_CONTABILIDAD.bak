// ============================================================================
// Edge Function: Actualizar Votos Vencidos
// Propósito: Ejecutar actualización diaria de votos vencidos
// Autor: Sistema de Gestión IPUC
// Fecha: 2025-12-20
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers siguiendo mejores prácticas de Supabase
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interfaz para el resultado de la función de BD
interface ActualizacionResult {
  votos_actualizados: number
  votos_ids: string[]
}

// ============================================================================
// Función Principal
// ============================================================================

serve(async (req: Request) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Variables para logging y métricas
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  console.log(`[${requestId}] 🚀 Iniciando Edge Function: actualizar-votos-vencidos`)
  console.log(`[${requestId}] 📅 Fecha/Hora: ${new Date().toISOString()}`)
  console.log(`[${requestId}] 🌍 Método: ${req.method}`)

  try {
    // ========================================================================
    // Seguridad: Verificar autenticación con clave secreta
    // ========================================================================
    const authHeader = req.headers.get('Authorization')
    const cronSecret = Deno.env.get('CRON_SECRET')
    
    // Validar que la petición viene de un origen autorizado
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error(`[${requestId}] ❌ Intento de acceso no autorizado`)
      console.error(`[${requestId}] 📍 IP/Origin: ${req.headers.get('x-forwarded-for') || 'unknown'}`)
      
      return new Response(
        JSON.stringify({ 
          error: 'No autorizado',
          message: 'Se requiere autenticación válida',
          request_id: requestId
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`[${requestId}] ✅ Autenticación exitosa`)

    // ========================================================================
    // Crear cliente de Supabase con privilegios de servicio
    // ========================================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] ❌ Variables de entorno faltantes`)
      throw new Error('Configuración de Supabase incompleta')
    }

    // Crear cliente con service role (bypassa RLS para operaciones administrativas)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`[${requestId}] 🔌 Cliente Supabase inicializado`)
    console.log(`[${requestId}] 🔄 Ejecutando función: actualizar_votos_vencidos()`)

    // ========================================================================
    // Verificar primero cuántos votos necesitan actualización
    // ========================================================================
    const { data: checkData, error: checkError } = await supabase
      .rpc('contar_votos_vencidos_pendientes')

    if (checkError) {
      console.error(`[${requestId}] ⚠️  Error al verificar votos pendientes:`, checkError)
    } else if (checkData && checkData.length > 0) {
      const pendientes = checkData[0]
      console.log(`[${requestId}] 📊 Votos pendientes de actualizar: ${pendientes.total_pendientes}`)
      if (pendientes.total_pendientes > 0) {
        console.log(`[${requestId}] 📋 IDs: ${pendientes.ids_pendientes?.slice(0, 5).join(', ')}${pendientes.ids_pendientes?.length > 5 ? '...' : ''}`)
        console.log(`[${requestId}] 📅 Fecha límite más antigua: ${pendientes.fecha_limite_mas_antigua}`)
      }
    }

    // ========================================================================
    // Ejecutar función de actualización
    // ========================================================================
    const { data, error } = await supabase.rpc('actualizar_votos_vencidos')

    if (error) {
      console.error(`[${requestId}] ❌ Error al ejecutar función de actualización:`, error)
      throw error
    }

    // Procesar resultados
    const result = data as ActualizacionResult[]
    const votosActualizados = result[0]?.votos_actualizados || 0
    const votosIds = result[0]?.votos_ids || []

    // ========================================================================
    // Logging detallado de resultados
    // ========================================================================
    const duration = Date.now() - startTime
    
    console.log(`[${requestId}] ⏱️  Duración de ejecución: ${duration}ms`)
    console.log(`[${requestId}] ✅ Votos actualizados: ${votosActualizados}`)
    
    if (votosActualizados > 0) {
      console.log(`[${requestId}] 📋 IDs actualizados:`)
      votosIds.forEach((id, index) => {
        console.log(`[${requestId}]    ${index + 1}. ${id}`)
      })
    } else {
      console.log(`[${requestId}] ℹ️  No hay votos para actualizar en este momento`)
    }

    // ========================================================================
    // Preparar respuesta exitosa
    // ========================================================================
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      request_id: requestId,
      duration_ms: duration,
      votos_actualizados: votosActualizados,
      votos_ids: votosIds,
      message: votosActualizados > 0 
        ? `${votosActualizados} voto${votosActualizados > 1 ? 's' : ''} actualizado${votosActualizados > 1 ? 's' : ''} a estado vencido`
        : 'No hay votos para actualizar',
      next_execution: 'Mañana a las 00:05 COT (05:05 UTC)'
    }

    console.log(`[${requestId}] 🎉 Ejecución completada exitosamente`)

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    // ========================================================================
    // Manejo de errores
    // ========================================================================
    const duration = Date.now() - startTime
    
    console.error(`[${requestId}] 💥 Error fatal en Edge Function:`)
    console.error(`[${requestId}] 📛 Mensaje: ${error.message}`)
    console.error(`[${requestId}] 📚 Stack: ${error.stack}`)
    console.error(`[${requestId}] ⏱️  Duración antes del error: ${duration}ms`)
    
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      request_id: requestId,
      duration_ms: duration,
      details: {
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n') // Primeras 3 líneas del stack
      }
    }

    return new Response(
      JSON.stringify(errorResponse, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// ============================================================================
// Para invocar manualmente:
// ============================================================================
/*
curl -i --location --request POST \
  'https://[TU_PROJECT_REF].supabase.co/functions/v1/actualizar-votos-vencidos' \
  --header "Authorization: Bearer [CRON_SECRET]" \
  --header 'Content-Type: application/json'
*/
