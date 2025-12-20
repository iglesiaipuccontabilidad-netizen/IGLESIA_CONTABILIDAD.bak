-- ============================================================================
-- Migración: Sistema de Actualización Automática de Votos Vencidos
-- Fecha: 2025-12-20
-- Descripción: Función para actualizar automáticamente el estado de votos
--              cuya fecha_limite ha vencido
-- ============================================================================

-- Función que actualiza votos vencidos
-- Siguiendo mejores prácticas de Supabase:
-- 1. SECURITY DEFINER para ejecutar con privilegios del creador
-- 2. SET search_path = '' para prevenir ataques de search path
-- 3. Uso de qualified names (public.votos)
-- 4. Retorno estructurado con conteo y IDs
CREATE OR REPLACE FUNCTION public.actualizar_votos_vencidos()
RETURNS TABLE(
  votos_actualizados integer,
  votos_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
  v_ids uuid[];
  v_fecha_actual date;
BEGIN
  -- Obtener fecha actual para logging
  v_fecha_actual := CURRENT_DATE;
  
  -- Log de inicio (visible en logs de Supabase)
  RAISE NOTICE 'Iniciando actualización de votos vencidos - Fecha: %', v_fecha_actual;

  -- Actualizar votos activos cuya fecha límite ya pasó
  -- Solo afecta votos que:
  -- 1. Estado = 'activo' (no tocar completados o ya vencidos)
  -- 2. fecha_limite < fecha actual
  -- 3. recaudado < monto_total (no están completos)
  WITH updated AS (
    UPDATE public.votos
    SET 
      estado = 'vencido',
      updated_at = now()
    WHERE 
      estado = 'activo'
      AND fecha_limite < v_fecha_actual
      AND recaudado < monto_total
    RETURNING id, proposito, fecha_limite
  )
  SELECT 
    COUNT(*)::integer,
    ARRAY_AGG(id)
  INTO v_count, v_ids
  FROM updated;

  -- Log de resultados
  IF v_count > 0 THEN
    RAISE NOTICE 'Votos actualizados: % | IDs: %', v_count, v_ids;
  ELSE
    RAISE NOTICE 'No hay votos para actualizar';
  END IF;

  -- Retornar resultados
  RETURN QUERY SELECT v_count, v_ids;

EXCEPTION
  WHEN OTHERS THEN
    -- Capturar y registrar cualquier error
    RAISE WARNING 'Error al actualizar votos vencidos: % - %', SQLERRM, SQLSTATE;
    -- Re-lanzar el error para que el llamador lo maneje
    RAISE;
END;
$$;

-- ============================================================================
-- Permisos y Seguridad
-- ============================================================================

-- Permitir ejecución desde:
-- - anon: Para Edge Function sin autenticación (con CRON_SECRET)
-- - authenticated: Para usuarios autenticados (administradores)
GRANT EXECUTE ON FUNCTION public.actualizar_votos_vencidos() TO anon, authenticated;

-- Revocar permisos innecesarios (solo lectura/ejecución)
REVOKE ALL ON FUNCTION public.actualizar_votos_vencidos() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_votos_vencidos() TO anon, authenticated;

-- ============================================================================
-- Metadata y Documentación
-- ============================================================================

COMMENT ON FUNCTION public.actualizar_votos_vencidos() IS 
'Actualiza automáticamente el estado de votos activos cuya fecha_limite ha vencido.

Comportamiento:
- Solo afecta votos con estado = ''activo''
- Requiere fecha_limite < CURRENT_DATE
- Solo si recaudado < monto_total (no completados)
- Cambia estado a ''vencido''
- Actualiza updated_at

Retorna:
- votos_actualizados: Número de votos modificados
- votos_ids: Array de UUIDs de votos actualizados

Uso:
  SELECT * FROM public.actualizar_votos_vencidos();

Diseñado para ser llamado desde:
- Edge Function (ejecución programada diaria)
- Manualmente por administradores

Autor: Sistema de Gestión IPUC
Fecha: 2025-12-20
Versión: 1.0';

-- ============================================================================
-- Función auxiliar: Verificar votos que necesitan actualización
-- ============================================================================

CREATE OR REPLACE FUNCTION public.contar_votos_vencidos_pendientes()
RETURNS TABLE(
  total_pendientes integer,
  ids_pendientes uuid[],
  fecha_limite_mas_antigua date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
  v_ids uuid[];
  v_fecha_antigua date;
BEGIN
  -- Contar votos que serían actualizados
  SELECT 
    COUNT(*)::integer,
    ARRAY_AGG(id ORDER BY fecha_limite),
    MIN(fecha_limite)
  INTO v_count, v_ids, v_fecha_antigua
  FROM public.votos
  WHERE 
    estado = 'activo'
    AND fecha_limite < CURRENT_DATE
    AND recaudado < monto_total;

  RETURN QUERY SELECT v_count, v_ids, v_fecha_antigua;
END;
$$;

GRANT EXECUTE ON FUNCTION public.contar_votos_vencidos_pendientes() TO anon, authenticated;

COMMENT ON FUNCTION public.contar_votos_vencidos_pendientes() IS 
'Función de utilidad para verificar cuántos votos necesitan actualización sin modificar datos.

Útil para:
- Monitoreo y auditoría
- Verificar antes de ejecutar actualización
- Dashboard administrativo

Retorna:
- total_pendientes: Cantidad de votos a actualizar
- ids_pendientes: Array de IDs que serían afectados
- fecha_limite_mas_antigua: Fecha del voto más antiguo vencido';

-- ============================================================================
-- Índices para Optimización de Performance
-- ============================================================================

-- Índice compuesto para optimizar la consulta de actualización
-- Cubre: estado + fecha_limite + recaudado vs monto_total
DROP INDEX IF EXISTS idx_votos_estado_fecha_limite_activos;
CREATE INDEX idx_votos_estado_fecha_limite_activos 
ON public.votos (estado, fecha_limite)
WHERE estado = 'activo';

COMMENT ON INDEX idx_votos_estado_fecha_limite_activos IS 
'Índice parcial para optimizar búsqueda de votos activos por fecha límite.
Usado por la función actualizar_votos_vencidos() para performance.';

-- ============================================================================
-- Verificación Post-Migración
-- ============================================================================

DO $$
BEGIN
  -- Verificar que la función se creó correctamente
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'actualizar_votos_vencidos' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE NOTICE '✅ Función actualizar_votos_vencidos() creada exitosamente';
  ELSE
    RAISE EXCEPTION '❌ Error: Función no se creó correctamente';
  END IF;

  -- Verificar que la función auxiliar se creó
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'contar_votos_vencidos_pendientes'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE NOTICE '✅ Función contar_votos_vencidos_pendientes() creada exitosamente';
  ELSE
    RAISE EXCEPTION '❌ Error: Función auxiliar no se creó correctamente';
  END IF;

  -- Verificar índice
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_votos_estado_fecha_limite_activos'
  ) THEN
    RAISE NOTICE '✅ Índice idx_votos_estado_fecha_limite_activos creado exitosamente';
  ELSE
    RAISE WARNING '⚠️  Índice no se creó - verificar manualmente';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'Migración completada exitosamente';
  RAISE NOTICE 'Siguiente paso: Probar con SELECT * FROM public.actualizar_votos_vencidos();';
  RAISE NOTICE '============================================';
END $$;
