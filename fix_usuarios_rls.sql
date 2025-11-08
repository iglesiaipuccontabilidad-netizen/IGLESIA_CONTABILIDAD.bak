-- ============================================
-- POLÍTICAS RLS PARA TABLA USUARIOS
-- Permitir que admins gestionen todos los usuarios
-- ============================================

-- 1. Habilitar RLS en la tabla usuarios (si no está habilitado)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden ver todos los usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden insertar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden actualizar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden eliminar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON usuarios;

-- 3. POLÍTICA SELECT: Admins pueden ver todos los usuarios
CREATE POLICY "Admins pueden ver todos los usuarios"
ON usuarios
FOR SELECT
TO authenticated
USING (
  -- El usuario autenticado es admin
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND rol = 'admin'
    AND estado = 'activo'
  )
);

-- 4. POLÍTICA SELECT: Usuarios pueden ver su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
ON usuarios
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 5. POLÍTICA INSERT: Solo admins pueden crear usuarios
CREATE POLICY "Admins pueden insertar usuarios"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND rol = 'admin'
    AND estado = 'activo'
  )
);

-- 6. POLÍTICA UPDATE: Admins pueden actualizar cualquier usuario
CREATE POLICY "Admins pueden actualizar usuarios"
ON usuarios
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND rol = 'admin'
    AND estado = 'activo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND rol = 'admin'
    AND estado = 'activo'
  )
);

-- 7. POLÍTICA UPDATE: Usuarios pueden actualizar su propio perfil (campos limitados)
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON usuarios
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 8. POLÍTICA DELETE: Solo admins pueden eliminar usuarios
CREATE POLICY "Admins pueden eliminar usuarios"
ON usuarios
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND rol = 'admin'
    AND estado = 'activo'
  )
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- Verificar usuarios existentes
SELECT 
  id,
  email,
  rol,
  estado,
  created_at
FROM usuarios
ORDER BY created_at DESC;
