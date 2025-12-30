-- Migración para hacer proposito_id obligatorio y proposito (descripción) opcional
-- Fecha: 2025-12-30
-- Versión: 3 (aplicada exitosamente)

-- Paso 0: Crear un propósito genérico para votos sin proposito_id asignado
INSERT INTO public.propositos (id, nombre, descripcion, estado, monto_objetivo, monto_recaudado)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'Propósitos Generales',
  'Categoría para compromisos financieros no asociados a un propósito específico',
  'activo',
  1000000000,
  0
)
ON CONFLICT (id) DO NOTHING;

-- Paso 1: Asignar el propósito genérico a todos los votos que no tienen proposito_id
UPDATE public.votos 
SET proposito_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
WHERE proposito_id IS NULL;

-- Paso 2: Hacer que proposito (descripción) sea opcional (permitir NULL)
ALTER TABLE public.votos 
ALTER COLUMN proposito DROP NOT NULL;

-- Paso 3: Hacer que proposito_id sea obligatorio (NOT NULL)
ALTER TABLE public.votos 
ALTER COLUMN proposito_id SET NOT NULL;

-- Paso 4: Agregar comentarios para documentar el cambio
COMMENT ON COLUMN public.votos.proposito IS 'Descripción adicional del voto (opcional). Este campo complementa la información del propósito asociado.';
COMMENT ON COLUMN public.votos.proposito_id IS 'ID del propósito asociado (obligatorio). Todo voto debe estar vinculado a un propósito.';

-- Paso 5: Crear índice para mejorar el rendimiento de consultas por proposito_id
CREATE INDEX IF NOT EXISTS idx_votos_proposito_id ON public.votos(proposito_id);
