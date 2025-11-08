# Solución al Error de Login: "Database error querying schema"

## Problema
Al intentar iniciar sesión con el usuario `emmaandrade2024@gmail.com`, aparece el error:
- **Error visual**: "Ha ocurrido un error al iniciar sesión"
- **Error en consola**: "Database error querying schema"
- **Código HTTP**: 200 (autenticación exitosa, pero falla la verificación posterior)

## Causa
El error ocurre porque las políticas RLS (Row Level Security) de la tabla `usuarios` no están configuradas correctamente para permitir que usuarios autenticados lean los registros inmediatamente después del login.

## Solución

### Opción 1: Ejecutar Script SQL en Supabase (RECOMENDADO)

1. **Accede al Dashboard de Supabase**
   - Ve a: https://czwbsvzfxpukvoearylt.supabase.co
   - Inicia sesión con tu cuenta

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New query"

3. **Copia y pega el siguiente script**:

```sql
-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view all users" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update their own data" ON public.usuarios;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.usuarios;
DROP POLICY IF EXISTS "Admins can view all statuses" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view their own status" ON public.usuarios;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.usuarios;

-- 2. Crear políticas correctas
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

-- 3. Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 4. Crear índices
CREATE INDEX IF NOT EXISTS idx_usuarios_id ON public.usuarios(id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON public.usuarios(estado);
```

4. **Ejecuta el script**
   - Haz clic en "Run" o presiona `Ctrl + Enter`
   - Verifica que no haya errores

5. **Verifica que el usuario existe y está activo**:

```sql
SELECT 
  u.id,
  u.email,
  u.rol,
  u.estado,
  au.email as auth_email
FROM public.usuarios u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'emmaandrade2024@gmail.com';
```

### Si el usuario NO aparece en la consulta anterior:

Ejecuta este script para crear/actualizar el registro:

```sql
-- Obtener el ID del usuario de auth.users
SELECT id, email FROM auth.users WHERE email = 'emmaandrade2024@gmail.com';

-- Copiar el ID y usarlo en la siguiente consulta (reemplaza 'USER_ID_AQUI')
INSERT INTO public.usuarios (id, email, rol, estado, created_at, updated_at)
VALUES (
  'USER_ID_AQUI',  -- Reemplaza con el ID real
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
```

### Opción 2: Verificar manualmente en Supabase Dashboard

1. **Ve a la tabla `usuarios`**:
   - Dashboard → Table Editor → usuarios
   - Busca el registro con email `emmaandrade2024@gmail.com`

2. **Verifica los campos**:
   - ✅ `estado` debe ser: `activo`
   - ✅ `rol` debe ser: `admin` o `tesorero` o `usuario`
   - ✅ `id` debe coincidir con el ID en `auth.users`

3. **Si no existe el registro**, créalo:
   - Haz clic en "Insert row"
   - Copia el `id` del usuario desde la tabla `auth.users`
   - Completa los campos:
     - `id`: [ID del usuario de auth.users]
     - `email`: emmaandrade2024@gmail.com
     - `rol`: admin
     - `estado`: activo

## Cambios realizados en el código

Se mejoró el archivo `src/app/login/actions.ts` para:
1. Agregar un pequeño delay (100ms) después del login para asegurar que la sesión se establezca
2. Mejorar el logging de errores con más detalles
3. Mostrar mensajes de error más descriptivos

## Verificación

Después de aplicar la solución:

1. **Limpia la caché del navegador** o abre una ventana de incógnito
2. **Intenta iniciar sesión** con:
   - Email: `emmaandrade2024@gmail.com`
   - Contraseña: `Emmanuel97.`
3. **Deberías ser redirigido** al dashboard sin errores

## Logs para debugging

Si el problema persiste, revisa los logs en la consola del navegador (F12) y busca:
- "Resultado de verificación de usuario"
- "Error al verificar usuario"

Estos logs mostrarán detalles específicos del error que ayudarán a diagnosticar el problema.

## Archivos modificados

- ✅ `src/app/login/actions.ts` - Mejorado manejo de errores y timing
- ✅ `supabase/migrations/20251107_fix_usuarios_rls_auth.sql` - Nueva migración
- ✅ `fix_login_rls.sql` - Script SQL para ejecutar manualmente

## Contacto

Si el problema persiste después de seguir estos pasos, verifica:
1. Los logs de Supabase en el Dashboard
2. Las políticas RLS en la tabla `usuarios`
3. Que el usuario existe en ambas tablas: `auth.users` y `public.usuarios`
