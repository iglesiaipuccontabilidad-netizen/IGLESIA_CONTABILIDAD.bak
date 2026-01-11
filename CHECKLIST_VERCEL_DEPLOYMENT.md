# ✅ Checklist de Verificación - Vercel Deployment

## 🔧 Variables de Entorno

Verificar en **Vercel Dashboard** → **Settings** → **Environment Variables**:

### Variables Requeridas:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - Formato: `https://[proyecto].supabase.co`
  - Valor de ejemplo: `https://czwbsvzfxpukvoearylt.supabase.co`

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Formato: JWT largo (eyJ...)
  - Disponible en: Supabase Dashboard → Settings → API

### Importante:
- ✅ Deben estar configuradas para **Production**, **Preview** y **Development**
- ✅ No deben tener espacios al inicio o al final
- ✅ Deben ser las mismas que funcionan en desarrollo

## 📝 Comando para Verificar Localmente

```bash
# 1. Construir para producción
npm run build

# 2. Iniciar en modo producción
npm start

# 3. Probar el flujo completo de registro de ventas
```

## 🔍 Logs en Vercel

### Ver logs en tiempo real:
```bash
vercel logs --follow
```

### O desde el Dashboard:
1. Ir a **Deployments**
2. Seleccionar el deployment activo
3. Clic en **Functions**
4. Ver logs de cada función

### Buscar estos mensajes:
- ❌ `ERROR CRÍTICO: Variables de Supabase no configuradas` → Configurar variables de entorno
- 🔍 `Iniciando createProyectoVenta` → La función está ejecutándose
- ✅ `Venta registrada exitosamente` → Todo funcionó correctamente

## 🔐 Verificar Permisos en Supabase

### 1. Conectar a SQL Editor en Supabase:

```sql
-- Ver políticas RLS de proyecto_ventas
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
WHERE tablename = 'proyecto_ventas';
```

### 2. Verificar que existe política de INSERT:

Debe haber una política que permita a miembros del comité insertar ventas.

### 3. Probar inserción manual:

```sql
-- Probar si el usuario puede insertar (reemplazar valores)
INSERT INTO proyecto_ventas (
  proyecto_id,
  producto_id,
  comprador_nombre,
  cantidad,
  precio_unitario,
  valor_total,
  monto_pagado,
  estado,
  fecha_venta,
  registrado_por
) VALUES (
  '[PROYECTO_ID]',
  '[PRODUCTO_ID]',
  'Prueba',
  1,
  10000,
  10000,
  0,
  'pendiente',
  NOW(),
  '[USER_ID]'
);
```

## 🚀 Pasos de Deployment

### 1. Commit y Push:
```bash
git add .
git commit -m "fix: Mejorar manejo de errores en registro de ventas"
git push origin main
```

### 2. Esperar el deployment automático en Vercel

### 3. Monitorear logs:
```bash
vercel logs --follow
```

### 4. Probar en producción:
1. Ir a la app en producción
2. Navegar a un proyecto
3. Intentar registrar una venta
4. Observar los logs en Vercel

## 🐛 Si el Error Persiste

### 1. Verificar logs detallados
Los logs ahora muestran exactamente dónde falla:
- 🔍 Inicio
- ✅ Proyecto encontrado
- 🔍 Verificando producto
- ✅ Producto validado
- 📝 Insertando venta
- ❌ **← Aquí verás el error específico**

### 2. Errores Comunes:

#### A. "Variables de Supabase no configuradas"
**Solución:**
1. Ir a Vercel Dashboard → Settings → Environment Variables
2. Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Re-deployar

#### B. "No tienes acceso a este comité"
**Solución:**
1. Verificar que el usuario esté asignado al comité
2. Revisar tabla `comite_usuarios` en Supabase
3. Verificar rol del usuario

#### C. "Producto no encontrado"
**Solución:**
1. Verificar que el producto existe
2. Verificar que pertenece al proyecto correcto
3. Verificar que está activo

#### D. "Permission denied for table proyecto_ventas"
**Solución:**
1. Revisar políticas RLS en Supabase
2. Asegurar que hay política de INSERT para miembros del comité
3. Verificar que la función de autenticación está funcionando

### 3. Comandos de Debug:

```bash
# Ver todas las variables de entorno configuradas
vercel env ls

# Ver el deployment activo
vercel ls

# Ver información del proyecto
vercel inspect [deployment-url]
```

## 📞 Información para Soporte

Si necesitas contactar soporte, proporciona:

1. **Error Digest ID** (aparece en el error boundary)
2. **Timestamp** del error
3. **Logs de Vercel** (captura de pantalla o texto)
4. **Variables de entorno** configuradas (sin mostrar valores completos)
5. **Versión del deployment**

## ✨ Nuevas Mejoras Implementadas

- ✅ Validación de variables de entorno al inicio
- ✅ Logging detallado en cada paso del proceso
- ✅ Mensajes de error específicos y accionables
- ✅ Error Boundary personalizado con mensajes amigables
- ✅ Información de debugging en desarrollo
- ✅ Manejo robusto de errores de Supabase

---

**Última actualización**: 10 de Enero de 2026
