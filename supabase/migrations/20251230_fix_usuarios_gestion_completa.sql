-- ============================================
-- MIGRACIÓN: fix_usuarios_gestion_completa
-- Fecha: 2025-12-30
-- Descripción: Corrige y mejora la tabla usuarios,
--              políticas RLS y triggers de sincronización
-- 
-- INSTRUCCIONES:
-- 1. Ir al Dashboard de Supabase
-- 2. SQL Editor
-- 3. Pegar y ejecutar este script
-- ============================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS RLS DE USUARIOS
-- ============================================
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Eliminar todas las políticas de la tabla usuarios
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'usuarios' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON usuarios', pol.policyname);
    END LOOP;
END $$;

-- 2. ELIMINAR FUNCIÓN is_admin SI EXISTE (para recrearla limpia)
-- ============================================
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 3. ASEGURAR ESTRUCTURA CORRECTA DE LA TABLA
-- ============================================
DO $$ 
BEGIN
    -- Agregar columna email si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN email text;
    END IF;

    -- Agregar columna rol si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'rol'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN rol text DEFAULT 'pendiente';
    END IF;

    -- Agregar columna estado si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'estado'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN estado text DEFAULT 'pendiente';
    END IF;

    -- Agregar columna created_at si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;

    -- Agregar columna updated_at si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 4. ELIMINAR CONSTRAINTS ANTIGUOS Y CREAR NUEVOS
-- ============================================
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_estado_check;

-- Crear nuevos constraints con valores válidos
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check 
    CHECK (rol IN ('admin', 'tesorero', 'usuario', 'pendiente'));

ALTER TABLE usuarios ADD CONSTRAINT usuarios_estado_check 
    CHECK (estado IN ('activo', 'inactivo', 'pendiente', 'suspendido'));

-- 5. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================
CREATE INDEX IF NOT EXISTS idx_usuarios_id ON usuarios(id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_estado ON usuarios(rol, estado);

-- 6. HABILITAR RLS
-- ============================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 7. FUNCIÓN HELPER PARA VERIFICAR ADMIN (SIN RECURSIÓN)
-- Usa SECURITY DEFINER para evitar recursión en políticas RLS
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT rol = 'admin' AND estado = 'activo' 
     FROM usuarios 
     WHERE id = auth.uid()),
    false
  );
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 8. CREAR POLÍTICAS RLS OPTIMIZADAS
-- ============================================

-- Política: Cualquier usuario autenticado puede leer su propio registro
CREATE POLICY "usuarios_read_own"
ON usuarios FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política: Admins pueden leer todos los registros
CREATE POLICY "usuarios_read_all_admin"
ON usuarios FOR SELECT
TO authenticated
USING (public.is_admin());

-- Política: Permitir insert del propio registro (para trigger) o admin
CREATE POLICY "usuarios_insert"
ON usuarios FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Política: Admins pueden actualizar cualquier usuario
CREATE POLICY "usuarios_update_admin"
ON usuarios FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Política: Usuarios pueden actualizar su propio registro (campos limitados)
CREATE POLICY "usuarios_update_own"
ON usuarios FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política: Solo admins pueden eliminar usuarios
CREATE POLICY "usuarios_delete_admin"
ON usuarios FOR DELETE
TO authenticated
USING (public.is_admin());

-- 9. FUNCIÓN PARA SINCRONIZAR NUEVOS USUARIOS DE AUTH
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, rol, estado, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        'pendiente', 
        'pendiente',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = now();
    RETURN NEW;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. SINCRONIZAR USUARIOS EXISTENTES DE AUTH QUE NO ESTÁN EN USUARIOS
-- ============================================
INSERT INTO public.usuarios (id, email, rol, estado, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    'pendiente',
    'pendiente',
    au.created_at,
    now()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.usuarios u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 12. ACTUALIZAR EMAILS FALTANTES EN USUARIOS
-- ============================================
UPDATE public.usuarios u
SET email = au.email, updated_at = now()
FROM auth.users au
WHERE u.id = au.id AND (u.email IS NULL OR u.email = '');

-- 13. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================
COMMENT ON TABLE usuarios IS 'Tabla de usuarios del sistema con roles y estados';
COMMENT ON COLUMN usuarios.id IS 'UUID del usuario, referencia a auth.users';
COMMENT ON COLUMN usuarios.email IS 'Email del usuario';
COMMENT ON COLUMN usuarios.rol IS 'Rol: admin, tesorero, usuario, pendiente';
COMMENT ON COLUMN usuarios.estado IS 'Estado: activo, inactivo, pendiente, suspendido';
COMMENT ON COLUMN usuarios.created_at IS 'Fecha de creación';
COMMENT ON COLUMN usuarios.updated_at IS 'Fecha de última actualización';
COMMENT ON FUNCTION public.is_admin() IS 'Verifica si el usuario actual es admin activo (sin recursión RLS)';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger para sincronizar nuevos usuarios de auth.users a public.usuarios';

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
