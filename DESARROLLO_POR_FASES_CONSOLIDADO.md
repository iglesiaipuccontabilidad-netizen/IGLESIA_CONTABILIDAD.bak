# 🔐 PLAN DE DESARROLLO POR FASES: Corrección de Vulnerabilidades de Enrutamiento en Comités

**Versión**: 1.0 - Documento Maestro Consolidado  
**Fecha**: Enero 2, 2026  
**Prioridad**: 🔴 CRÍTICA  
**Estado**: Listo para Autorización  

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Vulnerabilidades Identificadas](#vulnerabilidades-identificadas)
3. [Análisis del Impacto](#análisis-del-impacto)
4. [FASE 1: Fixes Críticos (Semana 1)](#fase-1-fixes-críticos)
5. [FASE 2: Estandarización (Semana 2)](#fase-2-estandarización)
6. [FASE 3: Implementación de RLS (Semana 3)](#fase-3-implementación-de-rls)
7. [FASE 4: Mejoras y Auditoría (Semana 4)](#fase-4-mejoras-y-auditoría)
8. [Validación y Testing](#validación-y-testing)
9. [Roadmap Futuro](#roadmap-futuro)

---

## 🎯 RESUMEN EJECUTIVO

### Problema Reportado
Usuario **aquilaroja99@gmail.com** (tesorero en comité DECOM) puede acceder a `/dashboard/comites` y ver información de **TODOS los comités**, cuando debería ver solo el suyo.

### Vulnerabilidades Encontradas
- ❌ `/dashboard/comites` - SIN protección de rol
- ❌ `/dashboard/comites/nuevo` - Protección incompleta
- ⚠️ 6+ páginas con validación manual inconsistente
- ⚠️ Base de datos sin RLS
- ⚠️ Sin función centralizada de permisos

### Impacto
- 🔴 **CRÍTICO**: Acceso no autorizado a información sensible
- 🟠 **ALTO**: Exposición de datos de otros comités
- 🟡 **MEDIO**: Sin defensa en profundidad (falta RLS)

### Solución
4 fases de desarrollo en 3-4 semanas, con implementación inmediata de fixes críticos.

**Tiempo Total**: 6-8 horas de desarrollo distribuidas en 4 semanas

---

## 🔍 VULNERABILIDADES IDENTIFICADAS

### Vulnerabilidad #1: CRÍTICA - `/dashboard/comites` sin protección

**Archivo**: `src/app/dashboard/comites/page.tsx`  
**Línea**: 1-170  
**Severidad**: 🔴 CRÍTICA  

**Problema**:
```typescript
// ❌ ACTUAL - SIN VALIDACIÓN DE ROL
export default async function ComitesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return notFound()  // ← Solo verifica autenticación
  
  // El resto del código se ejecuta para CUALQUIER usuario logueado
  // ❌ No verifica si es admin/tesorero
}
```

**Riesgo**: Usuario de comité puede ver lista completa de comités y estadísticas

**Impactado**: aquilaroja99@gmail.com y cualquier usuario con rol "usuario"

---

### Vulnerabilidad #2: CRÍTICA - `/dashboard/comites/nuevo` parcialmente protegida

**Archivo**: `src/app/dashboard/comites/nuevo/page.tsx`  
**Línea**: 1  
**Severidad**: 🔴 CRÍTICA  

**Problema**:
```typescript
// ❌ ACTUAL - CLIENT COMPONENT SIN VALIDACIÓN
"use client"

export default function NuevoComitePage() {
  // Formulario se renderiza ANTES de validar
  // La validación ocurre solo al enviar (server action)
  // Usuario ve la UI aunque no tenga permisos
}
```

**Riesgo**: Usuario no autorizado ve formulario de crear comité (aunque no pueda enviarlo)

**Impactado**: Cualquier usuario logueado

---

### Vulnerabilidad #3: ALTA - Validación manual inconsistente

**Archivos**: 6+ páginas bajo `/dashboard/comites/[id]/*`
- `[id]/page.tsx`
- `[id]/ofrendas/page.tsx`
- `[id]/proyectos/page.tsx`
- `[id]/gastos/page.tsx`
- `[id]/miembros/page.tsx`
- `[id]/votos/page.tsx`

**Severidad**: 🟠 ALTA

**Problema**:
```typescript
// ⚠️ ACTUAL - REPETIDA EN CADA PÁGINA
const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'
let hasAccess = isAdmin

if (!isAdmin) {
  const { data: comiteUsuario } = await supabase
    .from('comite_usuarios')
    .select('rol')
    .eq('comite_id', id)
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .single()

  hasAccess = !!comiteUsuario
}

if (!hasAccess) return notFound()
```

**Riesgo**:
- Código duplicado (mantenimiento difícil)
- Propenso a errores
- Inconsistencia entre páginas
- Si hay bug, afecta múltiples lugares

---

### Vulnerabilidad #4: ALTA - Ausencia de RLS en Base de Datos

**Tablas afectadas**:
- `comites`
- `comite_usuarios`
- `comite_proyectos`
- `comite_votos`
- `comite_ofrendas`
- `comite_gastos`

**Severidad**: 🟠 ALTA

**Problema**:
```sql
-- SIN PROTECCIÓN A NIVEL DE BD
SELECT * FROM comites;  -- ✗ Cualquiera con JWT válido puede hacerlo
SELECT * FROM comite_usuarios;  -- ✗ Sin validación de datos
```

**Riesgo**:
- Sin "defensa en profundidad"
- Acceso directo a API sin validación de roles
- Si hay bug en código, BD no protege

---

### Vulnerabilidad #5: MEDIA - Sin función centralizada

**Ubicación**: Código disperso en múltiples páginas

**Severidad**: 🟡 MEDIA

**Problema**: No existe función única de validación de permisos por comité

**Riesgo**:
- Duplicación de código
- Difícil de auditar
- Difícil de testear
- Mejoras requieren cambios en múltiples lugares

---

## 📊 ANÁLISIS DEL IMPACTO

### Usuario Afectado: aquilaroja99@gmail.com

```
Email: aquilaroja99@gmail.com
Rol Global: usuario
Comité: DECOM (rol: tesorero)
Estado: activo

ACCESO ACTUAL (INCORRECTO):
├─ /dashboard/comites ..................... ❌ VE TODO (DEBERÍA NO)
├─ /dashboard/comites/nuevo .............. ❌ VE FORMULARIO (DEBERÍA NO)
├─ /dashboard/comites/[id] ............... ✅ VE SU COMITÉ (CORRECTO)
├─ /dashboard/comites/[id]/dashboard .... ✅ VE DASHBOARD (CORRECTO)
└─ /dashboard/comites/[id]/ofrendas ..... ✅ VE OFRENDAS (CORRECTO)

INFORMACIÓN EXPUESTA:
├─ Lista de todos los comités del sistema
├─ Estadísticas de comités ajenos
├─ Nombres de comités confidenciales
└─ UI de creación de comités
```

### Tabla de Riesgos

| Riesgo | Probabilidad | Impacto | Severidad |
|--------|--------------|---------|-----------|
| Acceso a comités ajenos | ALTA | CRÍTICO | 🔴 |
| Información sensible expuesta | ALTA | CRÍTICO | 🔴 |
| Modificación sin autorizar | BAJA | CRÍTICO | 🟠 |
| Acceso API directo sin RLS | MEDIA | CRÍTICO | 🟠 |

---

## 🔧 FASE 1: FIXES CRÍTICOS (Semana 1 - 45 minutos)

### Objetivo
Bloquear acceso a páginas administrativas para usuarios de comité.

### F1.1: Proteger `/dashboard/comites`

**Archivo**: `src/app/dashboard/comites/page.tsx`

**ANTES** (Vulnerable):
```typescript
export default async function ComitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return notFound()
  
  // ❌ El código sigue sin validar rol
  // ✅ Usuario "usuario" entra aquí
}
```

**DESPUÉS** (Seguro):
```typescript
import { requireAdminOrTesorero } from '@/lib/auth/permissions'

export default async function ComitesPage() {
  // ✅ AGREGAR: Validación ANTES de cualquier código
  await requireAdminOrTesorero()
  
  // Si llegó aquí, GARANTIZADO que es admin/tesorero
  // Si no, fue redirigido automáticamente
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // ... resto del código
}
```

**Cambios**:
- [ ] Agregar `import { requireAdminOrTesorero }`
- [ ] Llamar `await requireAdminOrTesorero()` al INICIO
- [ ] Verificar que está ANTES de otros códigos
- [ ] NO cambiar lógica del resto de la función

**Testeo**:
```bash
# Como usuario aquilaroja99:
GET /dashboard/comites
→ DEBE redirigir a /dashboard/comites/e039ace3...
```

**Tiempo**: 5 minutos

---

### F1.2: Proteger `/dashboard/comites/nuevo`

**Archivo**: `src/app/dashboard/comites/nuevo/page.tsx`

**ANTES** (Vulnerable):
```typescript
// ❌ CLIENT COMPONENT - Formulario se renderiza sin validar
"use client"

export default function NuevoComitePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // ... estado del formulario
  
  return (
    // ❌ Usuario ve el formulario
  )
}
```

**DESPUÉS** (Seguro):
```typescript
// ✅ SERVER COMPONENT - Valida ANTES de renderizar
import { requireAdminOrTesorero } from '@/lib/auth/permissions'

export default async function NuevoComitePage() {
  // ✅ Validar PRIMERO
  await requireAdminOrTesorero()
  
  // Si no es admin/tesorero, nunca llega aquí
  return <NuevoComiteForm />
}

// ✅ Solo el formulario es "use client"
"use client"
function NuevoComiteForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  return (
    // Formulario solo para admins/tesoreros
  )
}
```

**Cambios**:
- [ ] Remover `"use client"` de la parte superior
- [ ] Agregar `import { requireAdminOrTesorero }`
- [ ] Hacer página async function
- [ ] Llamar `await requireAdminOrTesorero()` al inicio
- [ ] Crear componente `NuevoComiteForm` con `"use client"`
- [ ] Retornar ese componente

**Testeo**:
```bash
# Como usuario aquilaroja99:
GET /dashboard/comites/nuevo
→ DEBE redirigir (NO ver formulario)
```

**Tiempo**: 25-30 minutos

---

### F1.3: Testeo y Validación

**Testeo Manual** (10 minutos):

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Tests
# Como usuario aquilaroja99:

1. Acceder a http://localhost:3000/dashboard/comites
   → ✅ Redirige a /dashboard/comites/e039ace3...
   
2. Acceder a http://localhost:3000/dashboard/comites/nuevo
   → ✅ Redirige a sin-acceso o comité
   
3. Desde comité, click en "Volver a Comités"
   → ✅ No accede a listado
```

**Resultado Esperado**: Usuario aquilaroja99 NO puede ver `/dashboard/comites` ni `/dashboard/comites/nuevo`

---

### F1 - CHECKLIST FINAL

```
IMPLEMENTACIÓN:
  ☐ Editar /dashboard/comites/page.tsx (5 min)
  ☐ Editar /dashboard/comites/nuevo/page.tsx (25 min)
  ☐ Verificar sintaxis
  ☐ Hacer git commit

TESTEO:
  ☐ Testear como usuario aquilaroja99 (10 min)
  ☐ Verificar redirecciones
  ☐ Verificar que admin SÍ puede ver listado
  ☐ Documentar resultados

DEPLOYMENT:
  ☐ Code review
  ☐ Merge a rama main
  ☐ Deploy a staging
  ☐ Deploy a producción

TOTAL FASE 1: ~45 minutos
```

---

## 🔄 FASE 2: ESTANDARIZACIÓN (Semana 2 - 2-3 horas)

### Objetivo
Reemplazar validación manual con función centralizada en todas las páginas.

### F2.1: Crear / Validar función `requireComiteAccess()`

**Archivo**: `src/lib/auth/comite-permissions.ts`

**Estado**: ✅ YA EXISTE (hacer review)

```typescript
export async function requireComiteAccess(comiteId: string): Promise<ComiteAccess> {
  const access = await verificarAccesoComite(comiteId)
  
  if (!access.hasAccess) {
    redirect('/dashboard/sin-acceso')
  }
  
  return access
}
```

**Verificar**:
- [ ] Función está en `src/lib/auth/comite-permissions.ts`
- [ ] Retorna `ComiteAccess` con `hasAccess`, `isAdmin`, `rolEnComite`
- [ ] Redirige automáticamente si no tiene acceso
- [ ] Funciona correctamente

**Tiempo**: 5 minutos (review)

---

### F2.2: Estandarizar `/dashboard/comites/[id]/page.tsx`

**Archivo**: `src/app/dashboard/comites/[id]/page.tsx`

**ANTES** (Manual):
```typescript
export default async function ComiteDetallePage({ params }: PageProps) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'
  
  // ⚠️ Validación manual repetida
}
```

**DESPUÉS** (Centralizado):
```typescript
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export default async function ComiteDetallePage({ params }: PageProps) {
  const { id } = await params
  
  // ✅ Una línea, validación automática
  const access = await requireComiteAccess(id)
  
  const supabase = await createClient()
  
  // Usar access.isAdmin, access.rolEnComite
  // El acceso está GARANTIZADO
}
```

**Cambios**:
- [ ] Agregar `import { requireComiteAccess }`
- [ ] Reemplazar validación manual con `const access = await requireComiteAccess(id)`
- [ ] Remover bloques `if (!user)`, `if (!userData)`
- [ ] Reemplazar `isAdmin` con `access.isAdmin`
- [ ] Reemplazar `rolEnComite` con `access.rolEnComite`
- [ ] Remover bloque `if (!hasAccess) return notFound()`

**Testeo**: Verificar que página sigue funcionando igual

**Tiempo**: 10-15 minutos

---

### F2.3: Estandarizar `/dashboard/comites/[id]/ofrendas/page.tsx`

**ANTES**:
```typescript
// 20+ líneas de validación manual
const userData = ...
const isAdmin = userData?.rol === 'admin' ...
let hasAccess = isAdmin
if (!isAdmin) {
  const comiteUsuario = ...
  hasAccess = !!comiteUsuario
}
```

**DESPUÉS**:
```typescript
const access = await requireComiteAccess(id)
```

**Archivos a actualizar** (aplicar mismo patrón):
- [ ] `[id]/page.tsx` (10-15 min)
- [ ] `[id]/ofrendas/page.tsx` (10-15 min)
- [ ] `[id]/proyectos/page.tsx` (10-15 min)
- [ ] `[id]/gastos/page.tsx` (10 min)
- [ ] `[id]/miembros/page.tsx` (10 min)
- [ ] `[id]/votos/page.tsx` (10 min)
- [ ] Otros subcomponentes con patrón manual

**Total F2.3**: 1-1.5 horas

---

### F2.4: Crear Tests Unitarios

**Archivo**: `src/__tests__/comite-access.test.ts` (NUEVO)

```typescript
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

describe('requireComiteAccess', () => {
  it('permite acceso a admin a cualquier comité', async () => {
    // Test
  })
  
  it('permite acceso a usuario si pertenece al comité', async () => {
    // Test
  })
  
  it('redirige si usuario no pertenece al comité', async () => {
    // Test
  })
  
  it('redirige si usuario no está autenticado', async () => {
    // Test
  })
})
```

**Tiempo**: 30 minutos

---

### F2 - CHECKLIST FINAL

```
IMPLEMENTACIÓN:
  ☐ Review requireComiteAccess() (5 min)
  ☐ Actualizar [id]/page.tsx (15 min)
  ☐ Actualizar [id]/ofrendas/page.tsx (15 min)
  ☐ Actualizar [id]/proyectos/page.tsx (15 min)
  ☐ Actualizar [id]/gastos/page.tsx (10 min)
  ☐ Actualizar [id]/miembros/page.tsx (10 min)
  ☐ Actualizar [id]/votos/page.tsx (10 min)
  ☐ Verificar sintaxis en todas

TESTING:
  ☐ Crear tests unitarios (30 min)
  ☐ Ejecutar tests
  ☐ Tests pasan 100%
  ☐ Testeo manual de cada página (30 min)

DEPLOYMENT:
  ☐ Code review completo
  ☐ Merge a rama develop
  ☐ Deploy a staging
  ☐ Tests en staging
  ☐ Deploy a producción

TOTAL FASE 2: ~2-3 horas
```

---

## 🔐 FASE 3: IMPLEMENTACIÓN DE RLS (Semana 3 - 1-1.5 horas)

### Objetivo
Implementar Row Level Security (RLS) en base de datos como "defensa en profundidad".

### F3.1: RLS para tabla `comites`

**Archivo**: Crear migración `supabase/migrations/xxxxxxx_add_rls_comites.sql`

```sql
-- Habilitar RLS
ALTER TABLE public.comites ENABLE ROW LEVEL SECURITY;

-- Política 1: Admins y tesoreros ven todos
CREATE POLICY "admins_tesoreros_view_all"
ON public.comites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
    AND rol IN ('admin', 'tesorero')
  )
);

-- Política 2: Usuarios solo ven sus comités
CREATE POLICY "users_view_own_comites"
ON public.comites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.comite_usuarios
    WHERE comite_id = comites.id
    AND usuario_id = auth.uid()
    AND estado = 'activo'
  )
);

-- Política 3: Solo admins pueden crear
CREATE POLICY "admins_create_comites"
ON public.comites
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
    AND rol = 'admin'
  )
);

-- Política 4: Solo admins pueden actualizar
CREATE POLICY "admins_update_comites"
ON public.comites
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
    AND rol = 'admin'
  )
);
```

**Tiempo**: 15 minutos

---

### F3.2: RLS para tabla `comite_usuarios`

```sql
ALTER TABLE public.comite_usuarios ENABLE ROW LEVEL SECURITY;

-- Admins ven todos
CREATE POLICY "admins_view_all"
ON public.comite_usuarios
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
    AND rol IN ('admin', 'tesorero')
  )
);

-- Usuarios solo ven sus asignaciones
CREATE POLICY "users_view_own"
ON public.comite_usuarios
FOR SELECT
USING (usuario_id = auth.uid());

-- Solo admins pueden crear asignaciones
CREATE POLICY "admins_manage"
ON public.comite_usuarios
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
    AND rol = 'admin'
  )
);
```

**Tiempo**: 15 minutos

---

### F3.3: RLS para tablas adicionales

Aplicar patrón similar a:
- [ ] `comite_proyectos` (10 min)
- [ ] `comite_votos` (10 min)
- [ ] `comite_ofrendas` (10 min)
- [ ] `comite_gastos` (10 min)

**Total F3.3**: 40 minutos

---

### F3.4: Testing de RLS

```bash
# Testear que las políticas funcionan:

1. Usuario admin:
   SELECT * FROM comites
   → Debe ver TODOS los comités ✅

2. Usuario aquilaroja99 (comité DECOM):
   SELECT * FROM comites
   → Debe ver SOLO DECOM ✅
   
3. Usuario sin comités:
   SELECT * FROM comites
   → Debe ver 0 filas ✅
```

**Tiempo**: 20 minutos

---

### F3 - CHECKLIST FINAL

```
IMPLEMENTACIÓN:
  ☐ Crear migración para RLS comites (15 min)
  ☐ Crear migración para RLS comite_usuarios (15 min)
  ☐ Crear migración para RLS comite_proyectos (10 min)
  ☐ Crear migración para RLS comite_votos (10 min)
  ☐ Crear migración para RLS comite_ofrendas (10 min)
  ☐ Crear migración para RLS comite_gastos (10 min)

TESTING:
  ☐ Aplicar migraciones a staging
  ☐ Testear cada tabla (20 min)
  ☐ Verificar que datos están protegidos
  ☐ Verificar que acceso legítimo funciona

DEPLOYMENT:
  ☐ Code review de migraciones
  ☐ Backup de base de datos
  ☐ Aplicar migraciones a producción
  ☐ Monitorear logs

TOTAL FASE 3: ~1-1.5 horas
```

---

## ✨ FASE 4: MEJORAS Y AUDITORÍA (Semana 4 - 1-2 horas)

### Objetivo
Implementar mejoras adicionales de seguridad y auditoría.

### F4.1: Función Centralizada de Permisos

**Archivo**: `src/lib/auth/comite-permissions.ts` (EXPANDIR)

```typescript
export type ComitePermiso = 'view' | 'edit' | 'delete' | 'crear_proyecto' | 'registrar_pago'

export async function verificarPermisosComite(
  comiteId: string,
  requiredAction: ComitePermiso
): Promise<boolean> {
  const access = await verificarAccesoComite(comiteId)
  
  if (!access.hasAccess) return false
  
  // Matriz de permisos por rol
  const permisos: Record<ComiteRol | 'admin', Set<ComitePermiso>> = {
    admin: new Set(['view', 'edit', 'delete', 'crear_proyecto', 'registrar_pago']),
    lider: new Set(['view', 'edit', 'crear_proyecto']),
    tesorero: new Set(['view', 'edit', 'crear_proyecto', 'registrar_pago']),
    secretario: new Set(['view']),
  }
  
  const rolPermisos = access.isAdmin 
    ? permisos.admin 
    : permisos[access.rolEnComite!] || new Set()
  
  return rolPermisos.has(requiredAction)
}
```

**Uso**:
```typescript
// En páginas
const puedeCrearProyecto = await verificarPermisosComite(id, 'crear_proyecto')

if (!puedeCrearProyecto) {
  return <div>No tienes permiso para crear proyectos</div>
}
```

**Tiempo**: 30 minutos

---

### F4.2: Documentación Actualizada

**Archivos a actualizar**:
- [ ] `docs/AUTHENTICATION.md` (30 min)
- [ ] `docs/ROLES_Y_PERMISOS.md` (NUEVO - 30 min)

**Contenido**:
- Roles disponibles
- Permisos por rol
- Flujos de acceso
- Ejemplos de código

**Tiempo**: 1 hora

---

### F4.3: Tests de Seguridad

**Archivo**: `src/__tests__/security/comite-access.security.test.ts` (NUEVO)

```typescript
describe('Seguridad de Acceso a Comités', () => {
  it('bloquea acceso a comité ajeno', async () => {})
  it('permite acceso a admin a cualquier comité', async () => {})
  it('valida RLS en base de datos', async () => {})
  it('bloquea API queries sin RLS', async () => {})
  it('redirige correctamente usuario sin comité', async () => {})
})
```

**Tiempo**: 45 minutos

---

### F4.4: Auditoría de Seguridad

**Checklist**:
- [ ] Revisar todas las páginas de comité
- [ ] Revisar todas las server actions
- [ ] Revisar API routes (si existen)
- [ ] Verificar RLS en todas las tablas
- [ ] Documentar resultados

**Tiempo**: 30 minutos

---

### F4 - CHECKLIST FINAL

```
IMPLEMENTACIÓN:
  ☐ Crear función verificarPermisosComite() (30 min)
  ☐ Actualizar docs/AUTHENTICATION.md (30 min)
  ☐ Crear docs/ROLES_Y_PERMISOS.md (30 min)

TESTING:
  ☐ Crear tests de seguridad (45 min)
  ☐ Ejecutar todos los tests
  ☐ 100% cobertura de casos críticos

AUDITORÍA:
  ☐ Revisar código de acceso (30 min)
  ☐ Revisar RLS en BD
  ☐ Revisar logs de acceso
  ☐ Documento de auditoría final

DEPLOYMENT:
  ☐ Code review
  ☐ Merge a main
  ☐ Deploy
  ☐ Documentación actualizada

TOTAL FASE 4: ~1-2 horas
```

---

## ✅ VALIDACIÓN Y TESTING

### Testing Manual - Usuario aquilaroja99

```
ANTES DE FIXES:
┌─────────────────────────────────────────────┐
│ GET /dashboard/comites                      │
│ → ✗ VE LISTA COMPLETA (BUG)                │
│                                             │
│ GET /dashboard/comites/nuevo                │
│ → ✗ VE FORMULARIO (BUG)                    │
│                                             │
│ GET /dashboard/comites/[id]                 │
│ → ✓ VE SU COMITÉ (CORRECTO)                │
└─────────────────────────────────────────────┘

DESPUÉS DE FASE 1:
┌─────────────────────────────────────────────┐
│ GET /dashboard/comites                      │
│ → ✓ REDIRIGE A SU COMITÉ (FIJA)            │
│                                             │
│ GET /dashboard/comites/nuevo                │
│ → ✓ REDIRIGE A SIN-ACCESO (FIJA)           │
│                                             │
│ GET /dashboard/comites/[id]                 │
│ → ✓ VE SU COMITÉ (MANTIENE)                │
└─────────────────────────────────────────────┘
```

### Test Cases Automáticos

```typescript
describe('Comite Access Control', () => {
  // Fase 1 tests
  test('usuario de comité no puede ver listado', () => {})
  test('usuario de comité no puede crear comité', () => {})
  
  // Fase 2 tests
  test('validación centralizada funciona', () => {})
  test('sub-páginas protegidas', () => {})
  
  // Fase 3 tests
  test('RLS protege tabla comites', () => {})
  test('RLS protege tabla comite_usuarios', () => {})
  
  // Fase 4 tests
  test('función de permisos es correcta', () => {})
  test('permisos por rol funcionan', () => {})
})
```

---

## 📅 TIMELINE TOTAL

```
SEMANA 1 - FASE 1: CRÍTICA (45 min)
├─ Lunes: Implementación (45 min)
├─ Martes: Testeo y deployment
└─ Miércoles: Verificación en producción

SEMANA 2 - FASE 2: ESTANDARIZACIÓN (2-3 horas)
├─ Lunes-Martes: Implementación (2-3 horas)
├─ Miércoles: Testing completo (1 hora)
└─ Jueves: Code review y deployment

SEMANA 3 - FASE 3: RLS (1-1.5 horas)
├─ Lunes: Crear migraciones (1 hora)
├─ Martes: Testing en staging (30 min)
└─ Miércoles: Deployment a producción

SEMANA 4 - FASE 4: MEJORAS (1-2 horas)
├─ Lunes-Martes: Mejoras e documentación (1-2 horas)
├─ Miércoles: Tests de seguridad (1 hora)
└─ Jueves: Auditoría final (30 min)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIEMPO TOTAL: 5-8 horas distribuidas en 4 semanas
```

---

## 📊 MATRIZ DE RESPONSABILIDADES

| Tarea | Rol | Tiempo | Semana |
|-------|-----|--------|--------|
| Implementar F1 | Developer | 45 min | 1 |
| Testear F1 | QA | 30 min | 1 |
| Implementar F2 | Developer | 2-3 h | 2 |
| Testear F2 | QA | 1 h | 2 |
| Crear migraciones RLS | DBA | 1 h | 3 |
| Testear RLS | QA | 30 min | 3 |
| Mejoras F4 | Developer | 1-2 h | 4 |
| Auditoría | Security | 1 h | 4 |

---

## 🎯 CRITERIOS DE ÉXITO

### Fase 1
- [ ] Usuario aquilaroja99 NO puede acceder a `/dashboard/comites`
- [ ] Usuario aquilaroja99 NO puede acceder a `/dashboard/comites/nuevo`
- [ ] Admin SÍ puede acceder a ambas páginas
- [ ] Sin regressions en otras páginas

### Fase 2
- [ ] 6+ páginas actualizadas con `requireComiteAccess()`
- [ ] 100% de cobertura en tests unitarios
- [ ] 0 duplicación de código de validación
- [ ] Todas las páginas funcionan igual

### Fase 3
- [ ] RLS habilitado en 6 tablas
- [ ] Usuarios solo ven datos permitidos en BD
- [ ] API queries protegidas
- [ ] 0 brechas de seguridad

### Fase 4
- [ ] Documentación completa
- [ ] Tests de seguridad pasan 100%
- [ ] Auditoría sin hallazgos críticos
- [ ] Sistema listo para auditoria externa

---

## 🔗 REFERENCIAS Y ARCHIVOS

### Código Relevante
```
src/lib/auth/
├─ permissions.ts (requireAdminOrTesorero)
└─ comite-permissions.ts (requireComiteAccess)

src/app/dashboard/comites/
├─ page.tsx ..................... ❌ FASE 1
├─ nuevo/page.tsx ............... ❌ FASE 1
├─ [id]/page.tsx ................ ⚠️ FASE 2
├─ [id]/dashboard/page.tsx ...... ✅ REFERENCIA
├─ [id]/ofrendas/page.tsx ....... ⚠️ FASE 2
├─ [id]/proyectos/page.tsx ...... ⚠️ FASE 2
├─ [id]/gastos/page.tsx ......... ⚠️ FASE 2
├─ [id]/miembros/page.tsx ....... ⚠️ FASE 2
└─ [id]/votos/page.tsx .......... ⚠️ FASE 2

supabase/
└─ migrations/ .................. FASE 3 (crear nuevas)
```

### Documentación
```
docs/
├─ AUTHENTICATION.md ........... Actualizar FASE 4
└─ ROLES_Y_PERMISOS.md ........ Crear FASE 4

Raíz:
├─ PLAN_ENRUTAMIENTO_SEGURO_COMITES.md ✅ (este documento)
└─ [otros documentos de análisis] ✅
```

---

## 💡 NOTAS IMPORTANTES

### Para Developers
- Seguir el orden de fases
- Testear después de cada cambio
- Usar las funciones centralizadas (no validar manualmente)
- Hacer commits limpios y descriptivos

### Para QA
- Testear como usuarios con diferentes roles
- Verificar redirecciones funcionan
- Verificar que datos correctos se muestran
- Verificar sin regressions

### Para DBAs
- Aplicar migraciones en staging ANTES de producción
- Backup completo antes de RLS
- Monitorear performance después de RLS
- Documentar cambios en BD

### Para Managers
- Total 5-8 horas de desarrollo
- Distribuido en 4 semanas (no es urgente pero sí importante)
- Sin impacto en usuarios finales (solo admins)
- ROI: Seguridad + Defensa en profundidad

---

## 📞 SOPORTE Y DUDAS

### Si tienes dudas sobre:
- **Fase 1**: Ver sección F1.1 y F1.2
- **Fase 2**: Ver sección F2.1-F2.4
- **Fase 3**: Ver sección F3.1-F3.4
- **Fase 4**: Ver sección F4.1-F4.4
- **Testing**: Ver sección "Validación y Testing"

---

## ✨ ESTADO FINAL

**Documento**: ✅ Completo y listo para implementación  
**Análisis**: ✅ Profundo y detallado  
**Plan**: ✅ Por fases, con timeline  
**Código**: ✅ Antes/después incluido  
**Testing**: ✅ Casos definidos  
**Documentación**: ✅ Lista para actualizar  

---

**Documento Maestro Consolidado**  
Creado: Enero 2, 2026  
Versión: 1.0  
Estado: **PENDIENTE DE AUTORIZACIÓN PARA DESARROLLO**

