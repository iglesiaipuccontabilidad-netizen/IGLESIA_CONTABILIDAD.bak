-- Script para corregir el problema de login
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view all users" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update their own data" ON public.usuarios;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can view all statuses" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view their own status" ON public.usuarios;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.usuarios;

-- 2. Crear políticas correctas para usuarios autenticados
CREATE POLICY "Authenticated users can view all users"
  ON public.usuarios
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own data"
  ON public.usuarios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow insert for authenticated users"
  ON public.usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Asegurarse de que RLS está habilitado
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 4. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_usuarios_id ON public.usuarios(id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON public.usuarios(estado);

-- 5. Verificar que el usuario existe y está activo
-- Reemplaza 'emmaandrade2024@gmail.com' con el email del usuario
SELECT 
  u.id,
  u.email,
  u.rol,
  u.estado,
  au.email as auth_email,
  au.created_at as auth_created_at
FROM public.usuarios u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'emmaandrade2024@gmail.com';

-- Si el usuario no aparece en la consulta anterior, necesitas crearlo:
-- (Descomenta y ejecuta solo si es necesario)

/*
-- Primero, obtén el ID del usuario de auth.users
SELECT id, email FROM auth.users WHERE email = 'emmaandrade2024@gmail.com';

-- Luego, inserta el registro en la tabla usuarios usando el ID obtenido
-- Reemplaza 'USER_ID_AQUI' con el ID real del usuario
INSERT INTO public.usuarios (id, email, rol, estado, created_at, updated_at)
VALUES (
  'USER_ID_AQUI',
  'emmaandrade2024@gmail.com',
  'admin',
  'activo',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET estado = 'activo',
    rol = 'admin',
    updated_at = NOW();
*/
