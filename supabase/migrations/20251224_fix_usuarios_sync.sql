-- Migración para corregir sincronización de usuarios
-- Fecha: 2025-12-24
-- Descripción: Corrige inconsistencias entre auth.users y tabla usuarios

-- 1. Sincronizar usuarios que existen en auth.users pero no en usuarios
INSERT INTO public.usuarios (id, email, rol, estado, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    'pendiente' as rol,
    'pendiente' as estado,
    au.created_at,
    now() as updated_at
FROM auth.users au
WHERE au.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.usuarios u WHERE u.id = au.id
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Actualizar emails que no coinciden
UPDATE public.usuarios u
SET 
    email = au.email,
    updated_at = now()
FROM auth.users au
WHERE u.id = au.id 
  AND u.email != au.email
  AND au.deleted_at IS NULL;

-- 3. Eliminar usuarios que ya no existen en auth.users (soft delete)
UPDATE public.usuarios
SET 
    estado = 'inactivo',
    updated_at = now()
WHERE id NOT IN (
    SELECT id FROM auth.users WHERE deleted_at IS NULL
)
AND estado != 'inactivo';

-- 4. Mejorar el trigger para evitar duplicados
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Solo insertar si no existe ya el registro
    INSERT INTO public.usuarios (id, email, rol, estado, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'rol', 'pendiente'),
        'pendiente',
        NEW.created_at,
        NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Crear trigger para mantener emails sincronizados
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_update();

CREATE OR REPLACE FUNCTION public.handle_user_update() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Actualizar email si cambió en auth.users
    IF NEW.email != OLD.email THEN
        UPDATE public.usuarios
        SET 
            email = NEW.email,
            updated_at = now()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crear trigger para actualizaciones
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.handle_user_update();

-- 6. Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS usuarios_email_idx ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS usuarios_estado_idx ON public.usuarios(estado);
CREATE INDEX IF NOT EXISTS usuarios_rol_estado_idx ON public.usuarios(rol, estado);

-- 7. Agregar comentarios
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
    'Sincroniza automáticamente nuevos usuarios de auth.users a public.usuarios';

COMMENT ON TRIGGER on_auth_user_updated ON auth.users IS 
    'Mantiene sincronizado el email entre auth.users y public.usuarios';

COMMENT ON FUNCTION public.handle_new_user() IS 
    'Función trigger para crear registro en usuarios cuando se crea un usuario en auth';

COMMENT ON FUNCTION public.handle_user_update() IS 
    'Función trigger para actualizar el email en usuarios cuando cambia en auth';

-- 8. Verificar integridad
DO $$
DECLARE
    auth_count INTEGER;
    usuarios_count INTEGER;
    mismatch_count INTEGER;
BEGIN
    -- Contar usuarios en auth.users
    SELECT COUNT(*) INTO auth_count 
    FROM auth.users 
    WHERE deleted_at IS NULL;
    
    -- Contar usuarios en tabla usuarios con estado activo o pendiente
    SELECT COUNT(*) INTO usuarios_count 
    FROM public.usuarios 
    WHERE estado IN ('activo', 'pendiente');
    
    -- Contar desajustes de email
    SELECT COUNT(*) INTO mismatch_count
    FROM auth.users au
    INNER JOIN public.usuarios u ON u.id = au.id
    WHERE au.email != u.email AND au.deleted_at IS NULL;
    
    -- Registrar resultados
    RAISE NOTICE 'Verificación de sincronización:';
    RAISE NOTICE '- Usuarios en auth.users: %', auth_count;
    RAISE NOTICE '- Usuarios activos/pendientes en tabla usuarios: %', usuarios_count;
    RAISE NOTICE '- Emails desincronizados: %', mismatch_count;
    
    IF mismatch_count > 0 THEN
        RAISE WARNING 'Hay % usuarios con emails desincronizados', mismatch_count;
    ELSE
        RAISE NOTICE '✓ Todos los emails están sincronizados';
    END IF;
END $$;
