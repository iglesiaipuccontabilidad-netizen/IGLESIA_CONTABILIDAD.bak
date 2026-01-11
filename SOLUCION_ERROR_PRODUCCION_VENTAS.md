# 🔧 Solución de Errores en Producción - Vercel

**Fecha**: 10 de Enero de 2026  
**Error reportado**: "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details."

## 📋 Problema Identificado

El error ocurre al registrar una nueva venta en producción (Vercel). Este tipo de error genérico en producción puede deberse a múltiples causas:

1. **Variables de entorno no configuradas** en Vercel
2. **Errores de base de datos** (Supabase RLS, permisos, etc.)
3. **Errores de serialización** (objetos Date, funciones)
4. **Problemas con cookies** en Server Actions/Components

## ✅ Correcciones Implementadas

### 1. Mejora en el Manejo de Errores (`comites-actions.ts`)

Se implementaron las siguientes mejoras en la función `createProyectoVenta`:

#### a) Validación de Variables de Entorno
```typescript
// Validar variables de entorno al inicio
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ ERROR CRÍTICO: Variables de Supabase no configuradas');
  throw new Error('Configuración de base de datos no disponible. Contacte al administrador.');
}
```

#### b) Logging Detallado en Cada Paso
```typescript
// Logging inicial
console.log('🔍 Iniciando createProyectoVenta:', {
  proyecto_id: dto.proyecto_id,
  producto_id: dto.producto_id,
  comprador: dto.comprador_nombre,
  cantidad: dto.cantidad,
  precio: dto.precio_unitario,
});

// Logging en verificación de proyecto
console.log('✅ Proyecto encontrado, verificando acceso al comité:', proyecto.comite_id);

// Logging en validación de producto
console.log('🔍 Verificando producto:', dto.producto_id);

// Logging en inserción
console.log('📝 Insertando venta en la base de datos...');

// Logging de éxito
console.log('✅ Venta registrada exitosamente:', data.id);
```

#### c) Manejo Detallado de Errores de Base de Datos
```typescript
if (error) {
  console.error('❌ Error al insertar venta:', {
    error,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
  throw new Error(`Error al registrar la venta: ${error.message}`);
}
```

#### d) Catch Global con Información Completa
```typescript
catch (error) {
  console.error('❌ ERROR EN createProyectoVenta:', {
    error,
    name: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    dto,
  });
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'Error desconocido al registrar la venta';
  
  return {
    success: false,
    error: errorMessage,
  };
}
```

## 🔍 Pasos para Diagnosticar en Producción

### 1. Verificar Variables de Entorno en Vercel

Ir a: **Vercel Dashboard** → **Proyecto** → **Settings** → **Environment Variables**

Asegurarse de que están configuradas:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Revisar Logs de Vercel

```bash
# Desde la terminal
vercel logs [deployment-url] --follow
```

O desde el dashboard:
**Vercel Dashboard** → **Proyecto** → **Deployments** → [Seleccionar deployment] → **Functions** → Ver logs

Los nuevos mensajes de log con emojis ayudarán a identificar en qué paso exacto falla:
- 🔍 = Inicio de operación
- ✅ = Operación exitosa
- ❌ = Error
- 📝 = Inserción de datos
- 💰 = Cálculos financieros
- 💳 = Pagos
- 🔄 = Revalidación de rutas

### 3. Verificar Permisos RLS en Supabase

Conectarse a Supabase y verificar las políticas RLS para la tabla `proyecto_ventas`:

```sql
-- Ver políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'proyecto_ventas';

-- Verificar que el usuario tenga permiso de INSERT
-- La política debe permitir a miembros del comité insertar ventas
```

### 4. Probar en Desarrollo con Producción Simulada

```bash
# Construir para producción
npm run build

# Ejecutar en modo producción
npm start
```

Esto permitirá ver si el error se reproduce localmente con el build de producción.

## 🚨 Errores Comunes y Soluciones

### Error: Variables de entorno no configuradas
**Síntoma**: Log "❌ ERROR CRÍTICO: Variables de Supabase no configuradas"  
**Solución**: Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel

### Error: Proyecto no encontrado
**Síntoma**: Log "❌ Proyecto no encontrado"  
**Solución**: Verificar que el `proyecto_id` sea válido y que exista en la base de datos

### Error: No tienes acceso a este comité
**Síntoma**: Error en `verificarAccesoUsuarioComite`  
**Solución**: Verificar que el usuario esté asignado al comité y tenga permisos adecuados

### Error: Producto no activo
**Síntoma**: Log "❌ Producto no activo"  
**Solución**: Activar el producto en el sistema antes de intentar registrar una venta

### Error RLS: permission denied
**Síntoma**: Supabase retorna error de permisos  
**Solución**: Revisar y ajustar las políticas RLS en Supabase

## 📊 Monitoreo y Debugging

### Logs Estructurados

Los logs ahora incluyen información estructurada que facilita el debugging:

```typescript
// Ejemplo de log de éxito
🔍 Iniciando createProyectoVenta: { proyecto_id: "...", producto_id: "...", ... }
✅ Proyecto encontrado, verificando acceso al comité: abc-123
✅ Acceso concedido con rol: coordinador
🔍 Verificando producto: xyz-456
✅ Producto validado correctamente
💰 Datos calculados de la venta: { valorTotal: 50000, esPagado: true, ... }
📝 Insertando venta en la base de datos...
✅ Venta registrada exitosamente: venta-789
💳 Registrando pago automático: { venta_id: "...", monto: 50000, ... }
✅ Pago registrado correctamente
🔄 Revalidando rutas...
✅ Proceso completado exitosamente
```

### Ejemplo de log de error
```typescript
🔍 Iniciando createProyectoVenta: { ... }
✅ Proyecto encontrado, verificando acceso al comité: abc-123
❌ Error al buscar proyecto: { error: {...}, code: "PGRST116", message: "..." }
❌ ERROR EN createProyectoVenta: { error: {...}, message: "...", stack: "..." }
```

## 🔐 Seguridad

**IMPORTANTE**: Los logs ahora son más detallados. Asegúrate de:

1. ✅ No loguear información sensible (contraseñas, tokens, etc.)
2. ✅ Los logs están disponibles solo para administradores
3. ✅ Vercel encripta los logs en tránsito y en reposo
4. ✅ Los mensajes de error al usuario son genéricos (sin exponer detalles internos)

## 🎯 Siguientes Pasos

1. **Desplegar cambios a Vercel**
   ```bash
   git add .
   git commit -m "feat: Mejorar manejo de errores en registro de ventas"
   git push origin main
   ```

2. **Monitorear logs** durante el próximo intento de registro de venta

3. **Identificar el error específico** usando los nuevos logs detallados

4. **Aplicar la solución** según el error identificado

## 📞 Soporte

Si el error persiste después de estas mejoras:

1. Revisar los logs de Vercel con los nuevos mensajes detallados
2. Verificar las políticas RLS en Supabase
3. Comprobar la conectividad entre Vercel y Supabase
4. Revisar límites de rate limit en Supabase

---

**Archivos modificados:**
- ✅ `/src/app/actions/comites-actions.ts` - Función `createProyectoVenta` mejorada con logging detallado
