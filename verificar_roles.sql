-- Script de verificación de roles y funciones

-- 1. Ver todos los usuarios y sus roles
SELECT id, email, rol, estado 
FROM usuarios 
ORDER BY created_at DESC;

-- 2. Verificar la función is_admin() sin parámetros
SELECT pg_get_functiondef(oid)
FROM pg_proc 
WHERE proname = 'is_admin' 
AND pg_get_function_arguments(oid) = '';

-- 3. Probar la función con usuarios específicos
SELECT 
  id,
  email,
  rol,
  estado,
  (rol IN ('admin', 'tesorero') AND estado = 'activo') as should_be_admin
FROM usuarios
WHERE estado = 'activo';

-- 4. Verificar políticas RLS de usuarios
SELECT policyname, cmd, qual::text, with_check::text
FROM pg_policies 
WHERE tablename = 'usuarios'
ORDER BY policyname;
