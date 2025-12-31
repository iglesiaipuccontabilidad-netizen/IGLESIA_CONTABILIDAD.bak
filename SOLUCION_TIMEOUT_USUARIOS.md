# Solución de Problemas de Rendimiento en Consultas de Usuarios

## Problema
Las consultas a la tabla `usuarios` están tardando más de 8-15 segundos, causando timeouts en el sistema de autenticación.

## Síntoma
En la consola del navegador verás:
```
⚠️ Error de TIMEOUT - La consulta está siendo muy lenta.
```

## Solución

### Opción 1: Usar Supabase CLI (Recomendado)
```bash
# Aplicar la migración de optimización
npx supabase db push
```

### Opción 2: Aplicar manualmente en Supabase Dashboard
1. Ir a tu proyecto en Supabase Dashboard
2. Navegar a "SQL Editor"
3. Copiar y ejecutar el contenido del archivo:
   `supabase/migrations/20251231_optimize_usuarios_query.sql`

## ¿Qué hace la migración?
La migración añade índices importantes a la tabla `usuarios`:
- `idx_usuarios_id` - Índice en el campo `id` (clave primaria)
- `idx_usuarios_email` - Índice en el campo `email`
- `idx_usuarios_rol` - Índice en el campo `rol`
- `idx_usuarios_estado` - Índice en el campo `estado`

También ejecuta `ANALYZE` para actualizar las estadísticas del planificador de consultas.

## Verificación
Después de aplicar la migración, las consultas a la tabla `usuarios` deberían completarse en menos de 1 segundo.

## Otras mejoras implementadas
- Timeout reducido de 15s a 8s para detectar problemas más rápido
- Mejor manejo de errores de timeout
- Flag `memberLoaded` para evitar consultas duplicadas
- Backoff exponencial en reintentos
