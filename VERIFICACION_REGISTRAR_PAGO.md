# Verificación y Solución - Registro de Pagos

## Problema Reportado
El formulario de registro de pagos se queda en "Procesando..." indefinidamente.

## Diagnóstico

### 1. Código del Formulario
- **Ubicación**: `src/components/pagos/RegistroPagoForm.tsx`
- **Problema identificado**: Uso de `(supabase.rpc as any)` que puede causar errores silenciosos
- **Solución aplicada**: 
  - Eliminado el cast `as any`
  - Agregados logs detallados para debugging
  - Mejorado manejo de errores y respuestas

### 2. Función RPC en Supabase
- **Nombre**: `registrar_pago`
- **Ubicación**: `supabase/migrations/20231219_registro_pago_function.sql`
- **Estado**: Archivo existe, pero necesita verificar si está desplegada en Supabase

## Pasos para Resolver

### Opción 1: Verificar en Supabase Dashboard
1. Ir a Supabase Dashboard
2. Database > Functions
3. Buscar `registrar_pago`
4. Si no existe, ejecutar la migración

### Opción 2: Recrear la función manualmente
Ejecutar este SQL en Supabase SQL Editor:

```sql
-- Función para registrar un pago y actualizar el voto de forma atómica
CREATE OR REPLACE FUNCTION public.registrar_pago(
  p_voto_id uuid,
  p_monto numeric,
  p_fecha_pago date,
  p_metodo_pago text,
  p_nota text,
  p_registrado_por uuid,
  p_monto_total numeric
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recaudado numeric;
  v_estado text;
  v_result json;
BEGIN
  -- 1. Insertar el nuevo pago
  INSERT INTO public.pagos (
    voto_id,
    monto,
    fecha_pago,
    metodo_pago,
    nota,
    registrado_por
  ) VALUES (
    p_voto_id,
    p_monto,
    p_fecha_pago,
    p_metodo_pago,
    p_nota,
    p_registrado_por
  );

  -- 2. Calcular nuevo monto recaudado
  SELECT COALESCE(SUM(monto), 0)
  INTO v_recaudado
  FROM public.pagos
  WHERE voto_id = p_voto_id;

  -- 3. Determinar nuevo estado
  v_estado := CASE
    WHEN v_recaudado >= p_monto_total THEN 'completado'
    ELSE 'activo'
  END;

  -- 4. Actualizar el voto
  UPDATE public.votos
  SET
    recaudado = v_recaudado,
    estado = v_estado,
    updated_at = NOW()
  WHERE id = p_voto_id;

  -- 5. Preparar respuesta
  v_result := json_build_object(
    'success', true,
    'recaudado', v_recaudado,
    'estado', v_estado
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al procesar el pago: %', SQLERRM;
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.registrar_pago TO authenticated;
```

### Opción 3: Aplicar migración con Supabase CLI
```bash
npx supabase db push
```

## Cambios Aplicados al Código

### Archivo: `src/components/pagos/RegistroPagoForm.tsx`

**Mejoras implementadas:**
1. ✅ Eliminado `as any` de la llamada RPC
2. ✅ Agregados logs detallados en consola para debugging
3. ✅ Mejorado manejo de errores con mensajes específicos
4. ✅ Validación más robusta de la respuesta
5. ✅ Toast de sesión expirada más claro

**Logs agregados:**
- Estado de la sesión
- Parámetros enviados a `registrar_pago`
- Respuesta recibida de la función
- Errores específicos en cada paso

## Cómo Debuggear

1. **Abrir DevTools** (F12)
2. **Ir a Console**
3. **Intentar registrar un pago**
4. **Revisar los logs**:
   - ✅ "Llamando a registrar_pago con:"
   - ✅ "Respuesta de registrar_pago:"
   - ❌ Si hay error, verás "Error completo al procesar pago:"

## Posibles Errores y Soluciones

### Error: "function registrar_pago does not exist"
**Solución**: La función no está creada en Supabase
- Ejecutar el SQL de la Opción 2 arriba

### Error: "permission denied for function registrar_pago"
**Solución**: Falta permiso de ejecución
```sql
GRANT EXECUTE ON FUNCTION public.registrar_pago TO authenticated;
```

### Error: "Error al verificar la sesión"
**Solución**: Problema con autenticación
- Cerrar sesión y volver a iniciar
- Verificar cookies del navegador

### Se queda en "Procesando..." sin error
**Solución**: Revisar Network tab en DevTools
- Ver si la petición se completó
- Verificar el status code
- Ver la respuesta completa

## Verificación Post-Fix

Después de aplicar la solución:
1. ✅ Limpiar caché del navegador
2. ✅ Recargar la página
3. ✅ Intentar registrar un pago
4. ✅ Verificar logs en consola
5. ✅ Confirmar que el pago se registró en la base de datos

## Monitoreo

Para verificar que todo funciona:
```sql
-- Ver últimos pagos registrados
SELECT * FROM public.pagos ORDER BY created_at DESC LIMIT 10;

-- Ver estado de votos actualizados
SELECT id, proposito, monto_total, recaudado, estado 
FROM public.votos 
WHERE updated_at > NOW() - INTERVAL '1 hour';
```
