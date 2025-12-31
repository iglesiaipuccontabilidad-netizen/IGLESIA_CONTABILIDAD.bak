-- Optimización de queries a la tabla usuarios
-- ============================================
-- Problema: Las consultas a la tabla usuarios están tardando más de 15 segundos
-- Solución: Añadir índices y simplificar políticas RLS

-- 1. Añadir índice en el campo id (si no existe)
CREATE INDEX IF NOT EXISTS idx_usuarios_id ON usuarios(id);

-- 2. Añadir índice en email para búsquedas
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- 3. Añadir índice en rol para filtros
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- 4. Añadir índice en estado para filtros
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);

-- 5. Analizar la tabla para actualizar estadísticas del planificador
ANALYZE usuarios;

-- 6. Log de optimización
DO $$
BEGIN
  RAISE NOTICE 'Optimización de tabla usuarios completada';
  RAISE NOTICE 'Índices creados: idx_usuarios_id, idx_usuarios_email, idx_usuarios_rol, idx_usuarios_estado';
END $$;
