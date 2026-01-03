# 🔐 Plan de Enrutamiento Seguro para Usuarios de Comités

**Fecha**: Enero 2, 2026  
**Prioridad**: 🔴 CRÍTICA - Vulnerabilidad de Seguridad  
**Estado**: Planificación

---

## 📋 Resumen Ejecutivo

Se ha identificado una **vulnerabilidad crítica de control de acceso** donde usuarios con rol de comité (tesorero, líder, etc.) pueden acceder a páginas administrativas mediante navegación directa. Específicamente:

- ❌ Usuarios de comité pueden ver `/dashboard/comites` (solo admin/tesorero)
- ❌ El botón "Volver a Comités" en `/dashboard/comites/[id]` lleva a una página no protegida
- ❌ No hay validación consistente de permisos en todas las rutas

---

## 🔍 Vulnerabilidades Identificadas

### 1. **Página de Listado de Comités** (`/dashboard/comites`)
- **Estado**: ❌ NO PROTEGIDA
- **Ubicación**: `src/app/dashboard/comites/page.tsx`
- **Problema**: 
  - Solo verifica autenticación, NO verificar rol
  - Muestra todos los comités a cualquier usuario logueado
  - No usa `requireAdminOrTesorero()` 
- **Impacto**: Un tesorero de comité puede ver información de todos los comités
- **Usuario afectado**: aquilaroja99@gmail.com (tesorero en DECOM)

### 2. **Botón de Navegación Sin Protección**
- **Ubicación**: Múltiples páginas bajo `/dashboard/comites/[id]`
  - `src/app/dashboard/comites/[id]/page.tsx` - línea 95
  - `src/app/dashboard/comites/[id]/dashboard/page.tsx` - línea 81
  - `src/app/dashboard/comites/nuevo/page.tsx` - línea 65
- **Problema**: El enlace redirige a `/dashboard/comites` sin validar permisos
- **Riesgo**: Después de acceder a un comité, el usuario ve la página no protegida

### 3. **Inconsistencia en Validación de Acceso**
- **Problema**: Hay dos patrones diferentes de validación:

| Patrón | Ubicación | Protección |
|--------|-----------|-----------|
| `requireComiteAccess()` | `/dashboard/comites/[id]/dashboard` | ✅ Bueno |
| Manual `isAdmin` + acceso comité | `/dashboard/comites/[id]/page.tsx` | ⚠️ Incompleto |
| Validación manual | `/dashboard/comites/[id]/ofrendas` | ⚠️ Incompleto |

### 4. **Página de Creación de Comité** (`/dashboard/comites/nuevo`)
- **Ubicación**: `src/app/dashboard/comites/nuevo/page.tsx`
- **Tipo**: Cliente (`"use client"`)
- **Problema**: 
  - ⚠️ Es un componente cliente sin protección server-side
  - La validación de admin ocurre en la action `createComite()`
  - El usuario puede navegar a la URL antes de que se ejecute la acción

### 5. **Falta de RLS (Row Level Security) en Base de Datos**
- **Ubicación**: Tabla `comites`
- **Problema**: Sin políticas RLS, un usuario malicioso podría:
  - Acceder directamente a la API de Supabase
  - Obtener datos de todos los comités
  - Potencialmente modificar datos si las actions no validan

---

## 📊 Análisis de Acceso Actual - Usuario aquilaroja99

### Datos del Usuario
```
Email: aquilaroja99@gmail.com
ID: 010a5feb-de7f-4e72-bfa3-03f229374319
Rol Global: usuario
Estado: activo
Comité: DECOM (rol: tesorero)
```

### Acceso Actual
| Ruta | Protección | Usuario Puede Ver | Debería Ver |
|------|-----------|------------------|------------|
| `/dashboard` | ✅ `requireAdminOrTesorero()` | ❌ Redirigido a comité | ❌ No |
| `/dashboard/comites` | ❌ NINGUNA | ✅ **SÍ (PROBLEMA)** | ❌ No |
| `/dashboard/comites/nuevo` | ⚠️ Server Action | ✅ Formulario visible | ❌ No |
| `/dashboard/comites/{id}` | ⚠️ Manual | ✅ Sí (su comité) | ✅ Sí |
| `/dashboard/comites/{id}/dashboard` | ✅ `requireComiteAccess()` | ✅ Sí | ✅ Sí |
| `/dashboard/propositos` | ✅ `requireAdminOrTesorero()` | ❌ Redirigido | ❌ No |

---

## 🛠️ Plan de Corrección

### Fase 1: Protección de Rutas Críticas (INMEDIATO)

#### 1.1 Proteger `/dashboard/comites`
**Archivo**: `src/app/dashboard/comites/page.tsx`

```typescript
// ANTES:
export default async function ComitesPage() {
  // Solo verifica autenticación

// DESPUÉS:
import { requireAdminOrTesorero } from '@/lib/auth/permissions'

export default async function ComitesPage() {
  // Llamar al inicio de la página
  await requireAdminOrTesorero()
  
  // El resto del código solo se ejecuta si es admin/tesorero
```

**Impacto**: 
- ✅ Usuarios de comité serán redirigidos a su comité
- ✅ Solo admin/tesorero ven el listado

#### 1.2 Proteger `/dashboard/comites/nuevo`
**Archivo**: `src/app/dashboard/comites/nuevo/page.tsx`

```typescript
// Cambiar de "use client" a Server Component
// import { requireAdminOrTesorero } from '@/lib/auth/permissions'

export default async function NuevoComitePage() {
  await requireAdminOrTesorero()
  
  // Form como server component
  return <ComiteFormServer />
}
```

**Impacto**:
- ✅ Usuarios no admin no pueden acceder a la página
- ✅ No ven el formulario

#### 1.3 Estandarizar Validación en Páginas de Comité
**Ubicaciones afectadas**:
- `src/app/dashboard/comites/[id]/page.tsx`
- `src/app/dashboard/comites/[id]/ofrendas/page.tsx`
- `src/app/dashboard/comites/[id]/proyectos/page.tsx`
- `src/app/dashboard/comites/[id]/gastos/page.tsx`
- `src/app/dashboard/comites/[id]/miembros/page.tsx`
- `src/app/dashboard/comites/[id]/votos/page.tsx`

```typescript
// Reemplazar validación manual con:
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export default async function ComiteSubpagina({ params }: PageProps) {
  const { id } = await params
  
  // Esto valida AND redirige si no tiene acceso
  const access = await requireComiteAccess(id)
  
  // El resto del código
```

**Ventajas**:
- ✅ Código consistente
- ✅ Una sola fuente de verdad
- ✅ Más fácil de mantener

### Fase 2: Implementar RLS (Row Level Security) en BD

#### 2.1 Crear Políticas RLS para `comites`
```sql
-- Política 1: Admins y Tesoreros pueden ver todos los comités
CREATE POLICY admins_can_view_all_comites ON public.comites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND rol IN ('admin', 'tesorero')
    )
  );

-- Política 2: Usuarios de comité solo ven sus propios comités
CREATE POLICY users_can_view_own_comites ON public.comites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = id
      AND usuario_id = auth.uid()
      AND estado = 'activo'
    )
  );

-- Política 3: Solo admins pueden crear comités
CREATE POLICY admins_can_create_comites ON public.comites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND rol = 'admin'
    )
  );
```

**Impacto**:
- ✅ Defensa en profundidad
- ✅ Incluso si el código tiene bugs, la BD protege
- ✅ Previene acceso directo a API

#### 2.2 Crear Políticas RLS para `comite_usuarios`
```sql
-- Admins y tesoreros pueden ver todos
CREATE POLICY admins_can_view_all ON public.comite_usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
      AND rol IN ('admin', 'tesorero')
    )
  );

-- Usuarios solo ven sus propios roles
CREATE POLICY users_can_view_own ON public.comite_usuarios
  FOR SELECT
  USING (usuario_id = auth.uid());
```

---

### Fase 3: Mejoras en Permisos por Rol

#### 3.1 Crear Función Centralizada de Permisos
**Archivo**: `src/lib/auth/comite-permissions.ts` (expandir)

```typescript
/**
 * Valida acceso a una ruta específica según rol en comité
 * Retorna objeto con permisos para cada acción
 */
export async function verificarPermisosComite(
  comiteId: string,
  requiredAction: 'view' | 'edit' | 'delete' | 'crear_proyecto'
): Promise<PermisosComite> {
  const access = await verificarAccesoComite(comiteId)
  
  if (!access.hasAccess) return { permitido: false }
  
  const permisos: Record<ComiteRol, Set<string>> = {
    lider: new Set(['view', 'edit', 'crear_proyecto']),
    tesorero: new Set(['view', 'edit', 'crear_proyecto', 'registrar_pago']),
    secretario: new Set(['view']),
  }
  
  const rolPermisos = permisos[access.rolEnComite!] || new Set()
  
  return {
    permitido: rolPermisos.has(requiredAction),
    rol: access.rolEnComite,
    comiteId
  }
}
```

#### 3.2 Actualizar Documentación de Roles
**Crear/actualizar**: `docs/ROLES_Y_PERMISOS_COMITES.md`

---

### Fase 4: Pruebas de Seguridad

#### 4.1 Test Cases
```typescript
// test/security/comite-access.test.ts

describe('Acceso a Comités - Seguridad', () => {
  it('Usuario de comité NO puede ver /dashboard/comites', () => {
    // Simular usuario con rol "usuario" y comité
    // Verificar que redirige a su comité
  })
  
  it('Usuario de comité NO puede acceder a crear nuevo comité', () => {
    // Intentar POST a /api/comites
    // Debe retornar 403
  })
  
  it('Usuario sin comités ve /dashboard/sin-acceso', () => {
    // Usuario sin comités asignados
    // Intentar acceder a /dashboard
    // Debe redirigir a sin-acceso
  })
})
```

---

## 📅 Timeline Sugerido

| Fase | Tarea | Tiempo | Prioridad |
|------|-------|--------|-----------|
| 1.1 | Proteger `/dashboard/comites` | 15 min | 🔴 CRÍTICA |
| 1.2 | Proteger `/dashboard/comites/nuevo` | 30 min | 🔴 CRÍTICA |
| 1.3 | Estandarizar validación | 1-2 horas | 🟠 Alta |
| 2.1 | RLS para `comites` | 30 min | 🟠 Alta |
| 2.2 | RLS para `comite_usuarios` | 30 min | 🟠 Alta |
| 3.1 | Función centralizada | 1 hora | 🟡 Media |
| 4.1 | Tests de seguridad | 2 horas | 🟡 Media |
| **TOTAL** | | **5-7 horas** | |

---

## ✅ Checklist de Implementación

### Código
- [ ] Proteger `/dashboard/comites` con `requireAdminOrTesorero()`
- [ ] Proteger `/dashboard/comites/nuevo` como server component
- [ ] Reemplazar validación manual con `requireComiteAccess()` en:
  - [ ] `[id]/page.tsx`
  - [ ] `[id]/ofrendas/page.tsx`
  - [ ] `[id]/proyectos/page.tsx`
  - [ ] `[id]/gastos/page.tsx`
  - [ ] `[id]/miembros/page.tsx`
  - [ ] `[id]/votos/page.tsx`
- [ ] Crear función `verificarPermisosComite()` centralizada

### Base de Datos
- [ ] Crear políticas RLS para tabla `comites`
- [ ] Crear políticas RLS para tabla `comite_usuarios`
- [ ] Crear políticas RLS para `comite_proyectos`
- [ ] Crear políticas RLS para `comite_votos`
- [ ] Crear políticas RLS para `comite_ofrendas`
- [ ] Crear políticas RLS para `comite_gastos`

### Documentación
- [ ] Actualizar `docs/AUTHENTICATION.md`
- [ ] Crear `docs/ROLES_Y_PERMISOS_COMITES.md`
- [ ] Documentar flujos de acceso
- [ ] Crear guía de desarrollo

### Testing
- [ ] Tests unitarios de permisos
- [ ] Tests de integración de rutas
- [ ] Tests de seguridad manual
- [ ] Verificar con usuario de prueba

---

## 🔗 Archivos Relacionados

**Código de Permisos**:
- `src/lib/auth/permissions.ts` - Función `requireAdminOrTesorero()`
- `src/lib/auth/comite-permissions.ts` - Función `requireComiteAccess()`

**Páginas Afectadas**:
- `src/app/dashboard/comites/page.tsx` ⚠️ CRÍTICA
- `src/app/dashboard/comites/nuevo/page.tsx` ⚠️ CRÍTICA
- `src/app/dashboard/comites/[id]/page.tsx` ⚠️ Alto riesgo
- `src/app/dashboard/comites/[id]/dashboard/page.tsx` ✅ Bien (usa `requireComiteAccess`)

**Documentación Existente**:
- `docs/AUTHENTICATION.md`
- `CORRECCION_PERMISOS_SIDEBAR.md`

---

## 💡 Mejores Prácticas Aplicadas

### 1. **Defense in Depth (Defensa en Profundidad)**
- Validación en el frontend (UI)
- Validación en server components (Next.js)
- Validación en server actions
- Validación en base de datos (RLS)

### 2. **Single Source of Truth**
- Usar `requireAdminOrTesorero()` y `requireComiteAccess()` en lugar de validar manualmente
- Centralizar lógica de permisos

### 3. **Fail Secure**
- Si no tiene permisos → redirige a una página segura
- No muestra error, no expone información

### 4. **Least Privilege**
- Usuarios de comité solo ven su comité
- Tesoreros de comité no pueden crear comités nuevos
- Solo admin puede gestionar usuarios del sistema

### 5. **Consistent Validation**
- Mismo patrón de validación en todas las rutas
- Fácil de auditar
- Fácil de mantener

---

## 🚀 Próximos Pasos

1. **Inmediato (Hoy)**: Implementar Fase 1 (protección de rutas)
2. **Mañana**: Implementar Fase 2 (RLS en BD)
3. **Esta semana**: Implementar Fase 3 (función centralizada)
4. **Esta semana**: Pruebas completas (Fase 4)

---

## 📞 Contacto y Dudas

Para cualquier pregunta sobre este plan:
- Revisar `docs/AUTHENTICATION.md` para contexto
- Ver `CORRECCION_PERMISOS_SIDEBAR.md` para histórico
- Consultar `src/lib/auth/` para implementación actual

