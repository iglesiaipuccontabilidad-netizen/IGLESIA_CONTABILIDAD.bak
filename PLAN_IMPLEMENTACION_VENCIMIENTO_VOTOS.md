# 📋 Plan de Implementación: Sistema de Vencimiento Automático de Votos

## 🎯 Objetivo
Implementar un sistema robusto que actualice automáticamente el estado de los votos a "vencido" cuando su `fecha_limite` haya pasado, utilizando Edge Functions de Supabase con ejecución programada.

---

## 📊 Análisis del Problema

### Situación Actual
- ❌ Votos con `fecha_limite` vencida permanecen en estado "activo"
- ❌ No existe proceso automático para actualizar estados
- ❌ Solo se actualiza manualmente o al registrar pagos
- ❌ Inconsistencia entre frontend (espera "vencido") y backend (nunca lo asigna)

### Caso Detectado
```
Voto ID: c9df6d9d-01fb-4246-95e2-ee454f666e11
Propósito: Evangelismo
Fecha Límite: 2025-10-09 (71 días vencido)
Estado Actual: activo
Estado Esperado: vencido
```

---

## 🏗️ Arquitectura de la Solución

```
┌─────────────────────────────────────────────────────┐
│                  SUPABASE                           │
│                                                     │
│  ┌──────────────────┐         ┌─────────────────┐ │
│  │  pg_cron         │         │  Edge Function  │ │
│  │  (Scheduler)     │────────>│  actualizar-    │ │
│  │                  │ Ejecuta │  votos-vencidos │ │
│  │  Diario 00:05    │ cada    │                 │ │
│  │  UTC-5 (COT)     │ día     │  TypeScript     │ │
│  └──────────────────┘         └────────┬────────┘ │
│                                         │          │
│                                         v          │
│                                  ┌─────────────┐  │
│                                  │  Tabla:     │  │
│                                  │  votos      │  │
│                                  │             │  │
│                                  │  UPDATE     │  │
│                                  │  estado =   │  │
│                                  │  'vencido'  │  │
│                                  └─────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 📅 Plan de Implementación por Fases

### **FASE 1: Preparación de Base de Datos** ⏱️ 30 minutos

#### 1.1 Verificar Extensión pg_cron
```sql
-- Verificar si pg_cron está disponible en Supabase
SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';
```

**Nota:** Supabase no incluye pg_cron por defecto. Usaremos alternativa con Edge Functions + HTTP Cron trigger.

#### 1.2 Crear Función de Base de Datos
**Archivo:** `supabase/migrations/20251220_actualizar_votos_vencidos.sql`

```sql
-- Función que actualiza votos vencidos
CREATE OR REPLACE FUNCTION public.actualizar_votos_vencidos()
RETURNS TABLE(
  votos_actualizados integer,
  votos_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_ids uuid[];
BEGIN
  -- Actualizar votos activos cuya fecha límite ya pasó
  WITH updated AS (
    UPDATE public.votos
    SET 
      estado = 'vencido',
      updated_at = now()
    WHERE 
      estado = 'activo'
      AND fecha_limite < CURRENT_DATE
      AND recaudado < monto_total  -- Solo si no están completados
    RETURNING id
  )
  SELECT 
    COUNT(*)::integer,
    ARRAY_AGG(id)
  INTO v_count, v_ids
  FROM updated;

  -- Retornar resultados
  RETURN QUERY SELECT v_count, v_ids;
END;
$$;

-- Permitir ejecución desde Edge Function
GRANT EXECUTE ON FUNCTION public.actualizar_votos_vencidos() TO anon, authenticated;

-- Comentario descriptivo
COMMENT ON FUNCTION public.actualizar_votos_vencidos() IS 
  'Actualiza automáticamente el estado de votos activos cuya fecha límite ha vencido. 
   Solo afecta votos que no han alcanzado su meta de recaudación.';
```

**Tareas:**
- [ ] Crear archivo de migración
- [ ] Aplicar migración a Supabase
- [ ] Verificar que la función se creó correctamente
- [ ] Probar función manualmente: `SELECT * FROM actualizar_votos_vencidos();`

---

### **FASE 2: Desarrollo de Edge Function** ⏱️ 1 hora

#### 2.1 Crear Estructura de Edge Function
**Archivo:** `supabase/functions/actualizar-votos-vencidos/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActualizacionResult {
  votos_actualizados: number
  votos_ids: string[]
}

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticación con clave secreta
    const authHeader = req.headers.get('Authorization')
    const cronSecret = Deno.env.get('CRON_SECRET')
    
    // Validar que la petición viene de un origen autorizado
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Crear cliente de Supabase con privilegios de servicio
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Iniciando actualización de votos vencidos...')
    console.log(`📅 Fecha actual: ${new Date().toISOString()}`)

    // Ejecutar función de actualización
    const { data, error } = await supabase.rpc('actualizar_votos_vencidos')

    if (error) {
      console.error('❌ Error al actualizar votos:', error)
      throw error
    }

    const result = data as ActualizacionResult[]
    const votosActualizados = result[0]?.votos_actualizados || 0
    const votosIds = result[0]?.votos_ids || []

    console.log(`✅ Votos actualizados: ${votosActualizados}`)
    if (votosActualizados > 0) {
      console.log(`📋 IDs actualizados: ${votosIds.join(', ')}`)
    }

    // Registrar en tabla de logs (opcional - crear si necesario)
    const logData = {
      fecha_ejecucion: new Date().toISOString(),
      votos_actualizados: votosActualizados,
      votos_ids: votosIds,
      estado: 'exitoso'
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        votos_actualizados: votosActualizados,
        votos_ids: votosIds,
        message: votosActualizados > 0 
          ? `${votosActualizados} voto(s) actualizado(s) a estado vencido`
          : 'No hay votos para actualizar'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 Error en Edge Function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

#### 2.2 Configuración de la Edge Function
**Archivo:** `supabase/functions/actualizar-votos-vencidos/deno.json`

```json
{
  "tasks": {
    "start": "deno run --allow-net --allow-env index.ts"
  },
  "imports": {
    "supabase": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

**Tareas:**
- [ ] Crear directorio `supabase/functions/actualizar-votos-vencidos/`
- [ ] Crear archivo `index.ts` con el código
- [ ] Crear archivo `deno.json`
- [ ] Probar localmente con Deno

---

### **FASE 3: Deployment y Configuración** ⏱️ 45 minutos

#### 3.1 Desplegar Edge Function

```bash
# 1. Instalar Supabase CLI (si no está instalado)
npm install -g supabase

# 2. Autenticar con Supabase
supabase login

# 3. Link al proyecto
supabase link --project-ref [TU_PROJECT_REF]

# 4. Desplegar la función
supabase functions deploy actualizar-votos-vencidos --no-verify-jwt

# 5. Generar y guardar CRON_SECRET
CRON_SECRET=$(openssl rand -base64 32)
echo "CRON_SECRET: $CRON_SECRET"

# 6. Configurar secrets en Supabase
supabase secrets set CRON_SECRET="$CRON_SECRET"
```

#### 3.2 Configurar Servicio de Cron Externo

**Opción A: Usar Cron-Job.org (Gratis)**
1. Ir a https://cron-job.org
2. Crear cuenta gratuita
3. Crear nuevo cron job:
   - **URL:** `https://[TU_PROJECT_REF].supabase.co/functions/v1/actualizar-votos-vencidos`
   - **Schedule:** `5 5 * * *` (05:05 UTC = 00:05 COT)
   - **Headers:**
     ```
     Authorization: Bearer [CRON_SECRET]
     Content-Type: application/json
     ```
   - **Método:** POST

**Opción B: GitHub Actions (Recomendada para proyectos con Git)**
**Archivo:** `.github/workflows/actualizar-votos-vencidos.yml`

```yaml
name: Actualizar Votos Vencidos

on:
  schedule:
    # Ejecutar a las 00:05 hora Colombia (05:05 UTC)
    - cron: '5 5 * * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  actualizar-votos:
    runs-on: ubuntu-latest
    steps:
      - name: Ejecutar Edge Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/actualizar-votos-vencidos
```

**Configurar Secrets en GitHub:**
```bash
# En tu repositorio GitHub:
# Settings > Secrets and variables > Actions > New repository secret

CRON_SECRET: [tu_cron_secret]
SUPABASE_PROJECT_REF: [tu_project_ref]
```

**Tareas:**
- [ ] Desplegar Edge Function
- [ ] Configurar CRON_SECRET
- [ ] Elegir servicio de cron (cron-job.org o GitHub Actions)
- [ ] Configurar job programado
- [ ] Probar ejecución manual

---

### **FASE 4: Testing y Validación** ⏱️ 1 hora

#### 4.1 Crear Votos de Prueba

```sql
-- Crear voto vencido para pruebas
INSERT INTO public.votos (
  miembro_id,
  proposito,
  monto_total,
  recaudado,
  fecha_limite,
  estado,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM miembros LIMIT 1), -- Usar un miembro existente
  'PRUEBA - Voto Vencido',
  100000,
  0,
  '2025-12-15', -- Fecha ya pasada
  'activo',
  now(),
  now()
) RETURNING id;
```

#### 4.2 Ejecutar Pruebas

**Test 1: Ejecutar función manualmente**
```sql
SELECT * FROM actualizar_votos_vencidos();
-- Debería retornar: votos_actualizados: 1 o más
```

**Test 2: Ejecutar Edge Function localmente**
```bash
# Terminal 1: Iniciar Supabase local
supabase start

# Terminal 2: Servir función localmente
supabase functions serve actualizar-votos-vencidos

# Terminal 3: Probar con curl
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/actualizar-votos-vencidos' \
  --header 'Authorization: Bearer [ANON_KEY]' \
  --header 'Content-Type: application/json'
```

**Test 3: Ejecutar Edge Function en producción**
```bash
curl -i --location --request POST \
  'https://[TU_PROJECT_REF].supabase.co/functions/v1/actualizar-votos-vencidos' \
  --header "Authorization: Bearer $CRON_SECRET" \
  --header 'Content-Type: application/json'
```

**Test 4: Verificar cambios**
```sql
-- Ver votos actualizados
SELECT 
  id,
  proposito,
  fecha_limite,
  estado,
  updated_at
FROM votos
WHERE estado = 'vencido'
ORDER BY updated_at DESC
LIMIT 10;
```

#### 4.3 Matriz de Pruebas

| Escenario | Estado Inicial | Fecha Límite | Recaudado | Estado Esperado |
|-----------|---------------|--------------|-----------|-----------------|
| Voto sin pagos vencido | activo | < hoy | 0 | vencido |
| Voto parcialmente pagado vencido | activo | < hoy | < meta | vencido |
| Voto completado vencido | activo | < hoy | ≥ meta | activo (no cambia) |
| Voto activo vigente | activo | ≥ hoy | < meta | activo (no cambia) |
| Voto ya vencido | vencido | < hoy | < meta | vencido (no cambia) |

**Tareas:**
- [ ] Crear votos de prueba para cada escenario
- [ ] Ejecutar función y verificar resultados
- [ ] Validar logs de ejecución
- [ ] Confirmar que el frontend muestra correctamente "vencido"

---

### **FASE 5: Monitoreo y Logging** ⏱️ 30 minutos

#### 5.1 Crear Tabla de Logs (Opcional pero Recomendado)

```sql
-- Tabla para registrar ejecuciones del cron
CREATE TABLE IF NOT EXISTS public.cron_logs_votos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha_ejecucion timestamptz DEFAULT now(),
  votos_actualizados integer NOT NULL,
  votos_ids uuid[],
  duracion_ms integer,
  estado text CHECK (estado IN ('exitoso', 'error')),
  mensaje_error text,
  created_at timestamptz DEFAULT now()
);

-- Índice para consultas rápidas
CREATE INDEX idx_cron_logs_fecha ON public.cron_logs_votos(fecha_ejecucion DESC);

-- RLS: Solo administradores pueden ver logs
ALTER TABLE public.cron_logs_votos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admin puede ver logs"
  ON public.cron_logs_votos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND rol = 'admin'
    )
  );

-- Función para limpiar logs antiguos (mantener últimos 90 días)
CREATE OR REPLACE FUNCTION public.limpiar_logs_antiguos()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.cron_logs_votos
  WHERE fecha_ejecucion < now() - interval '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
```

#### 5.2 Actualizar Edge Function para Logging

```typescript
// Agregar después de ejecutar actualizar_votos_vencidos()
const startTime = Date.now()

// ... ejecutar función ...

const duracionMs = Date.now() - startTime

// Guardar log
await supabase.from('cron_logs_votos').insert({
  votos_actualizados: votosActualizados,
  votos_ids: votosIds,
  duracion_ms: duracionMs,
  estado: 'exitoso'
})
```

#### 5.3 Dashboard de Monitoreo

**Consulta para ver estadísticas:**
```sql
-- Resumen de ejecuciones últimos 30 días
SELECT 
  DATE(fecha_ejecucion) as fecha,
  COUNT(*) as ejecuciones,
  SUM(votos_actualizados) as total_votos_actualizados,
  AVG(duracion_ms) as duracion_promedio_ms,
  COUNT(*) FILTER (WHERE estado = 'error') as errores
FROM cron_logs_votos
WHERE fecha_ejecucion >= now() - interval '30 days'
GROUP BY DATE(fecha_ejecucion)
ORDER BY fecha DESC;
```

**Tareas:**
- [ ] Crear tabla de logs
- [ ] Actualizar Edge Function para registrar logs
- [ ] Crear consultas de monitoreo
- [ ] Configurar alertas (opcional)

---

### **FASE 6: Documentación y Handoff** ⏱️ 30 minutos

#### 6.1 Actualizar Documentación del Proyecto

**Archivo:** `docs/SISTEMA_VENCIMIENTO_VOTOS.md`

```markdown
# Sistema de Vencimiento Automático de Votos

## Descripción
Sistema que actualiza automáticamente el estado de votos a "vencido" cuando 
su fecha límite ha pasado.

## Componentes
1. **Función DB:** `actualizar_votos_vencidos()`
2. **Edge Function:** `actualizar-votos-vencidos`
3. **Cron Job:** GitHub Actions (diario 00:05 COT)
4. **Tabla Logs:** `cron_logs_votos`

## Ejecución Manual
```sql
SELECT * FROM actualizar_votos_vencidos();
```

## Monitoreo
Ver logs: Dashboard > Logs de Cron
```

#### 6.2 README para Operaciones

**Archivo:** `OPERACIONES_VOTOS_VENCIDOS.md`

- Cómo ejecutar manualmente
- Troubleshooting común
- Contactos de soporte
- Procedimientos de emergencia

**Tareas:**
- [ ] Crear documentación técnica
- [ ] Crear guía de operaciones
- [ ] Actualizar README principal
- [ ] Capacitar al equipo

---

## 📋 Checklist Final de Implementación

### Pre-implementación
- [ ] Backup completo de base de datos
- [ ] Verificar que hay votos de prueba
- [ ] Documentar estado actual de votos

### Implementación
- [ ] **FASE 1:** Crear y aplicar migración de función DB
- [ ] **FASE 2:** Desarrollar Edge Function
- [ ] **FASE 3:** Desplegar y configurar cron
- [ ] **FASE 4:** Ejecutar suite de pruebas completa
- [ ] **FASE 5:** Configurar logging y monitoreo
- [ ] **FASE 6:** Documentar y capacitar

### Post-implementación
- [ ] Monitorear primera ejecución automática
- [ ] Verificar logs por 1 semana
- [ ] Validar con stakeholders
- [ ] Actualizar runbook de operaciones

---

## 🚨 Plan de Rollback

### Si algo falla en Producción:

**1. Desactivar Cron Job inmediatamente**
```bash
# GitHub Actions: Deshabilitar workflow
# cron-job.org: Pausar job
```

**2. Revertir cambios manualmente**
```sql
-- Si votos fueron actualizados incorrectamente
UPDATE votos
SET estado = 'activo',
    updated_at = now()
WHERE id IN (
  -- IDs de votos afectados
  SELECT unnest(votos_ids) 
  FROM cron_logs_votos 
  WHERE fecha_ejecucion >= '2025-12-20'
);
```

**3. Eliminar Edge Function**
```bash
supabase functions delete actualizar-votos-vencidos
```

**4. Eliminar función de DB**
```sql
DROP FUNCTION IF EXISTS public.actualizar_votos_vencidos();
```

---

## ⏱️ Timeline Estimado

| Fase | Duración | Dependencias |
|------|----------|--------------|
| Fase 1 | 30 min | Ninguna |
| Fase 2 | 1 hora | Fase 1 |
| Fase 3 | 45 min | Fase 2 |
| Fase 4 | 1 hora | Fase 3 |
| Fase 5 | 30 min | Fase 4 |
| Fase 6 | 30 min | Fase 5 |
| **TOTAL** | **4 horas 15 min** | |

**Recomendación:** Implementar en horario de bajo tráfico (ej: domingo temprano).

---

## 📞 Contactos y Recursos

### Supabase
- Dashboard: https://app.supabase.com
- Docs Edge Functions: https://supabase.com/docs/guides/functions
- Docs Database Functions: https://supabase.com/docs/guides/database/functions

### Monitoreo
- Logs de Edge Functions: Dashboard > Edge Functions > Logs
- Database Logs: Dashboard > Database > Logs

### Soporte
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: [tu-repositorio]/issues

---

## ✅ Criterios de Éxito

1. **Funcional:**
   - ✅ Votos vencidos se actualizan automáticamente cada día
   - ✅ No se actualizan votos ya completados
   - ✅ Frontend muestra correctamente estado "vencido"

2. **Rendimiento:**
   - ✅ Ejecución completa en < 10 segundos
   - ✅ Sin impacto en performance del sistema

3. **Confiabilidad:**
   - ✅ Logs de todas las ejecuciones
   - ✅ Tasa de éxito > 99%
   - ✅ Plan de rollback probado

4. **Operacional:**
   - ✅ Equipo capacitado
   - ✅ Documentación completa
   - ✅ Procedimientos de emergencia definidos

---

## 🎯 Próximos Pasos

1. **Revisar y aprobar este plan**
2. **Asignar recursos y fechas**
3. **Ejecutar Fase 1**
4. **Iterar hasta completar todas las fases**

---

**Fecha de creación:** 2025-12-20  
**Versión:** 1.0  
**Estado:** Pendiente de aprobación  
**Autor:** GitHub Copilot
