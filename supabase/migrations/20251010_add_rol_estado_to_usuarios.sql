--- Verificar si la tabla usuarios existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
        CREATE TABLE public.usuarios (
            id uuid PRIMARY KEY REFERENCES auth.users(id),
            email text NOT NULL,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
    END IF;
END
$$;

-- Agregar columnas rol y estado a la tabla usuarios si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'usuarios' 
                  AND column_name = 'rol') THEN
        ALTER TABLE usuarios ADD COLUMN rol text DEFAULT 'pendiente';
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check 
            CHECK (rol IN ('admin', 'usuario', 'pendiente', 'tesorero'));
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'usuarios' 
                  AND column_name = 'estado') THEN
        ALTER TABLE usuarios ADD COLUMN estado text DEFAULT 'pendiente';
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_estado_check 
            CHECK (estado IN ('activo', 'inactivo', 'pendiente'));
    END IF;
END
$$;

-- Crear índice para búsquedas por rol
CREATE INDEX IF NOT EXISTS usuarios_rol_idx ON usuarios(rol);

-- Actualizar políticas RLS para incluir las nuevas columnas
-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Los usuarios pueden ver su propia información" ON "public"."usuarios";
DROP POLICY IF EXISTS "Los administradores pueden ver todos los usuarios" ON "public"."usuarios";
DROP POLICY IF EXISTS "Los administradores pueden actualizar usuarios" ON "public"."usuarios";

-- Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Crear nuevas políticas
CREATE POLICY "Los usuarios pueden ver su propia información" 
    ON "public"."usuarios"
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Los administradores pueden ver todos los usuarios" 
    ON "public"."usuarios"
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM usuarios 
            WHERE rol = 'admin' AND estado = 'activo'
        )
    );

CREATE POLICY "Los administradores pueden actualizar usuarios" 
    ON "public"."usuarios"
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM usuarios 
            WHERE rol = 'admin' AND estado = 'activo'
        )
    );

-- Agregar comentarios a las columnas
COMMENT ON COLUMN usuarios.rol IS 'Rol del usuario en el sistema: admin, usuario, pendiente o tesorero';
COMMENT ON COLUMN usuarios.estado IS 'Estado del usuario: activo, inactivo o pendiente';

-- Crear función para asignar rol inicial a nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, rol, estado)
    VALUES (new.id, new.email, 'pendiente', 'pendiente');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();