-- Crear un tipo enum para los estados posibles
DO $$ BEGIN
    CREATE TYPE estado_usuario AS ENUM ('activo', 'inactivo', 'pendiente', 'suspendido');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar la columna estado a la tabla usuarios con el tipo enum
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS estado estado_usuario NOT NULL DEFAULT 'activo'::estado_usuario;