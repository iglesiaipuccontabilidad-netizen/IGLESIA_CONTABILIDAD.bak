# 🚀 Guía de Deployment: Edge Function

## 📋 Pre-requisitos

- ✅ Node.js y npm instalados
- ✅ Cuenta de Supabase
- ✅ Proyecto de Supabase creado
- ✅ Git configurado (para GitHub Actions)

---

## 🛠️ Paso 1: Preparación

### 1.1 Verificar estructura de archivos

```bash
# Debe existir:
supabase/functions/actualizar-votos-vencidos/index.ts
supabase/functions/actualizar-votos-vencidos/deno.json
.github/workflows/actualizar-votos-vencidos.yml
```

### 1.2 Generar CRON_SECRET

```bash
# Generar un secret aleatorio seguro
openssl rand -base64 32

# Guarda este valor - lo necesitarás para:
# - Configurar en Supabase
# - Configurar en GitHub Secrets
```

**Ejemplo de output:**
```
Kx7vN9mQwP8zL2tY5hR3jF6dC1nB4sA0=
```

---

## 🚀 Paso 2: Autenticación con Supabase

### 2.1 Login a Supabase

```bash
npx supabase login
```

Esto abrirá tu navegador para autenticarte.

### 2.2 Link al proyecto

```bash
# Opción 1: Link interactivo (seleccionar de lista)
npx supabase link

# Opción 2: Link directo con project-ref
npx supabase link --project-ref <TU_PROJECT_REF>
```

**¿Cómo obtener tu PROJECT_REF?**
- Dashboard de Supabase > Project Settings > General
- Es el ID que aparece en la URL: `https://app.supabase.com/project/[PROJECT_REF]`

---

## 📦 Paso 3: Deployment

### Opción A: Usar Script Automatizado (Recomendado)

```bash
# Ejecutar script de deployment
./scripts/deploy-edge-function.sh
```

El script hará:
1. ✅ Verificar estructura del proyecto
2. ✅ Autenticar con Supabase
3. ✅ Desplegar Edge Function
4. ✅ Configurar secrets (si existe .env.production)
5. ✅ Mostrar próximos pasos

### Opción B: Deployment Manual

```bash
# 1. Desplegar función (sin verificar JWT)
npx supabase functions deploy actualizar-votos-vencidos --no-verify-jwt

# 2. Configurar CRON_SECRET
npx supabase secrets set CRON_SECRET="<tu_secret_generado>"

# 3. Verificar deployment
npx supabase functions list
```

---

## 🔐 Paso 4: Configurar Secrets

### 4.1 Configurar en Supabase

```bash
# Opción 1: Un secret a la vez
npx supabase secrets set CRON_SECRET="<tu_secret>"

# Opción 2: Desde archivo .env.production
npx supabase secrets set --env-file .env.production

# Verificar secrets configurados
npx supabase secrets list
```

### 4.2 Configurar en GitHub (para GitHub Actions)

1. Ve a tu repositorio en GitHub
2. Navega a: **Settings > Secrets and variables > Actions**
3. Click **New repository secret**
4. Agrega los siguientes secrets:

| Nombre | Valor | Descripción |
|--------|-------|-------------|
| `CRON_SECRET` | El secret generado con openssl | Token de autenticación |
| `SUPABASE_PROJECT_REF` | Tu project ID | ID del proyecto Supabase |

**Ejemplo de SUPABASE_PROJECT_REF:** `abcdefghijklmnop`

---

## ✅ Paso 5: Verificación

### 5.1 Verificar en Supabase Dashboard

1. Ve a: **Dashboard > Edge Functions**
2. Deberías ver: `actualizar-votos-vencidos`
3. Estado: **Active**

### 5.2 Probar la función manualmente

#### Opción A: Usar Script de Test

```bash
# Con parámetros
./scripts/test-edge-function.sh [PROJECT_REF] [CRON_SECRET]

# Interactivo (te pedirá los valores)
./scripts/test-edge-function.sh
```

#### Opción B: Test Manual con curl

```bash
# Reemplaza [PROJECT_REF] y [CRON_SECRET]
curl -i --location --request POST \
  'https://[PROJECT_REF].supabase.co/functions/v1/actualizar-votos-vencidos' \
  --header "Authorization: Bearer [CRON_SECRET]" \
  --header 'Content-Type: application/json'
```

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "timestamp": "2025-12-20T22:48:16.000Z",
  "votos_actualizados": 0,
  "message": "No hay votos para actualizar",
  "duration_ms": 125
}
```

### 5.3 Verificar Logs

**En Supabase:**
- Dashboard > Edge Functions > actualizar-votos-vencidos > Logs

**En GitHub Actions:**
- Actions > Actualizar Votos Vencidos

---

## 🔄 Paso 6: Activar Automatización

### 6.1 GitHub Actions

El workflow ya está configurado en `.github/workflows/actualizar-votos-vencidos.yml`

**Ejecución automática:**
- ✅ Diario a las 00:05 COT (05:05 UTC)
- ✅ Se ejecutará automáticamente

**Ejecución manual:**
1. Ve a: **Actions > Actualizar Votos Vencidos**
2. Click **Run workflow**
3. Selecciona branch: `main`
4. Click **Run workflow**

### 6.2 Verificar Primera Ejecución

Después de configurar:
1. Ejecuta manualmente el workflow (ver arriba)
2. Revisa los logs en Actions
3. Verifica que retorna 200 OK
4. Confirma que muestra votos actualizados (si hay alguno)

---

## 📊 Monitoreo y Mantenimiento

### Ver Ejecuciones de GitHub Actions

```bash
# En el repositorio
git log --oneline -- .github/workflows/actualizar-votos-vencidos.yml
```

O visita: `https://github.com/[TU_USUARIO]/[TU_REPO]/actions`

### Ver Logs de Edge Function

**Dashboard de Supabase:**
1. Edge Functions > actualizar-votos-vencidos
2. Tab "Logs"
3. Filtrar por fecha/hora

**Con CLI:**
```bash
# Ver logs recientes
npx supabase functions logs actualizar-votos-vencidos

# Ver logs en tiempo real
npx supabase functions logs actualizar-votos-vencidos --follow
```

### Verificar Votos Actualizados

```sql
-- En SQL Editor de Supabase
-- Ver últimos votos vencidos
SELECT id, proposito, fecha_limite, estado, updated_at
FROM votos
WHERE estado = 'vencido'
ORDER BY updated_at DESC
LIMIT 10;

-- Contar votos por estado
SELECT estado, COUNT(*) as total
FROM votos
GROUP BY estado;
```

---

## 🐛 Troubleshooting

### Problema: Error 401 (Unauthorized)

**Causa:** CRON_SECRET incorrecto o no configurado

**Solución:**
```bash
# Verificar secrets configurados
npx supabase secrets list

# Re-configurar CRON_SECRET
npx supabase secrets set CRON_SECRET="<secret_correcto>"

# Verificar en GitHub Secrets también
```

### Problema: Error 500 (Internal Server Error)

**Causa:** Error en la función o en la base de datos

**Solución:**
1. Revisa logs en Supabase Dashboard
2. Verifica que la función de BD existe:
```sql
SELECT * FROM pg_proc WHERE proname = 'actualizar_votos_vencidos';
```
3. Prueba la función de BD directamente:
```sql
SELECT * FROM actualizar_votos_vencidos();
```

### Problema: GitHub Action falla

**Causa:** Secrets no configurados o PROJECT_REF incorrecto

**Solución:**
1. Verifica que los secrets existen en GitHub
2. Revisa el PROJECT_REF (no debe tener https:// ni .supabase.co)
3. Re-ejecuta el workflow manualmente

### Problema: La función no actualiza ningún voto

**Causa:** No hay votos vencidos en la base de datos

**Verificación:**
```sql
-- Ver votos que deberían estar vencidos
SELECT * FROM contar_votos_vencidos_pendientes();
```

**Solución:** Esto es normal si no hay votos con fecha_limite vencida.

---

## 🔄 Actualizar la Edge Function

Si necesitas hacer cambios en la función:

```bash
# 1. Edita el código
vim supabase/functions/actualizar-votos-vencidos/index.ts

# 2. Re-deploya
npx supabase functions deploy actualizar-votos-vencidos --no-verify-jwt

# 3. Verifica cambios
./scripts/test-edge-function.sh
```

---

## 📚 Referencias

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

## ✅ Checklist de Deployment

- [ ] Node.js y npm instalados
- [ ] CRON_SECRET generado con openssl
- [ ] Autenticado con Supabase (`npx supabase login`)
- [ ] Proyecto linkeado (`npx supabase link`)
- [ ] Edge Function desplegada
- [ ] CRON_SECRET configurado en Supabase
- [ ] Secrets configurados en GitHub
- [ ] Función probada manualmente (200 OK)
- [ ] GitHub Action ejecutado exitosamente
- [ ] Logs verificados (sin errores)
- [ ] Monitoreo activo

---

**Última actualización:** 2025-12-20  
**Versión:** 1.0
