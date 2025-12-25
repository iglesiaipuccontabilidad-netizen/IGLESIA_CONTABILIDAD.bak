-- Migración para limpiar y corregir tabla usuarios
-- Fecha: 2025-12-24
-- Descripción: Limpia usuarios huérfanos y mejora índices

-- 1. Identificar y marcar como inactivos los usuarios que no existen en auth.users
UPDATE public.usuarios
SET 
    estado = 'inactivo',
    updated_at = now()
WHERE id NOT IN (
    SELECT id FROM auth.users WHERE deleted_at IS NULL
)
AND estado != 'inactivo';

-- 2. Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS usuarios_email_idx ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS usuarios_estado_idx ON public.usuarios(estado);
CREATE INDEX IF NOT EXISTS usuarios_rol_estado_idx ON public.usuarios(rol, estado);

-- 3. Agregar constraint para verificar sincronización
ALTER TABLE public.usuarios 
DROP CONSTRAINT IF EXISTS usuarios_id_fkey;

ALTER TABLE public.usuarios 
ADD CONSTRAINT usuarios_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 4. Verificar integridad después de la limpieza
DO $$
DECLARE
    auth_count INTEGER;
    usuarios_activos INTEGER;
    usuarios_inactivos INTEGER;
BEGIN
    -- Contar usuarios en auth.users
    SELECT COUNT(*) INTO auth_count 
    FROM auth.users 
    WHERE deleted_at IS NULL;
    
    -- Contar usuarios activos/pendientes
    SELECT COUNT(*) INTO usuarios_activos
    FROM public.usuarios 
    WHERE estado IN ('activo', 'pendiente', 'suspendido');
    
    -- Contar usuarios inactivos
    SELECT COUNT(*) INTO usuarios_inactivos
    FROM public.usuarios 
    WHERE estado = 'inactivo';
    
    -- Registrar resultados
    RAISE NOTICE '═══════════════════════════════════════════';
    RAISE NOTICE 'VERIFICACIÓN DE SINCRONIZACIÓN DE USUARIOS';
    RAISE NOTICE '═══════════════════════════════════════════';
    RAISE NOTICE '✓ Usuarios en auth.users: %', auth_count;
    RAISE NOTICE '✓ Usuarios activos en tabla usuarios: %', usuarios_activos;
    RAISE NOTICE '✓ Usuarios inactivos (huérfanos): %', usuarios_inactivos;
    RAISE NOTICE '═══════════════════════════════════════════';
END $$;
