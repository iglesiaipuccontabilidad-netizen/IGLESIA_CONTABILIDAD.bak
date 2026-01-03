# 🚨 Resumen de Vulnerabilidades de Seguridad Identificadas

**Análisis realizado**: Enero 2, 2026  
**Usuario reportador**: Función de navegación "Volver a Comités"  
**Severidad**: 🔴 CRÍTICA

---

## 📊 Vulnerabilidades Encontradas

### Resumen Rápido
```
Total de páginas analizadas: 8
Páginas NO protegidas: 3 ❌
Páginas con protección inconsistente: 4 ⚠️
Páginas correctamente protegidas: 1 ✅
```

---

## 🔴 CRÍTICA: Página de Listado de Comités

### `/dashboard/comites`
```
Archivo: src/app/dashboard/comites/page.tsx
Línea: Líneas 1-170
Protección: NINGUNA ❌
```

**Problema**: 
- ✋ Solo verifica que el usuario esté autenticado
- ❌ NO verifica que sea admin o tesorero
- 🔓 Cualquier usuario logueado puede verla
- 📊 Muestra información de TODOS los comités

**Impacto**:
- Usuario aquilaroja99 (tesorero DECOM) puede ver lista completa de comités
- Puede ver estadísticas de comités a los que NO pertenece
- Información potencialmente sensible expuesta

**Ejemplo de flujo inseguro**:
```
1. aquilaroja99 accede a /dashboard/comites/[id] (su comité DECOM)
2. Hace click en "Volver a Comités"
3. Accede a /dashboard/comites
4. VE TODOS LOS COMITÉS (no debería)
5. Ve botón "Nuevo Comité" (aunque no puede crear)
```

**Solución**:
```typescript
import { requireAdminOrTesorero } from '@/lib/auth/permissions'

export default async function ComitesPage() {
  // ✅ AGREGAR ESTA LÍNEA AL INICIO
  await requireAdminOrTesorero()
  
  // El resto del código...
}
```

---

## 🔴 CRÍTICA: Página de Crear Comité

### `/dashboard/comites/nuevo`
```
Archivo: src/app/dashboard/comites/nuevo/page.tsx
Línea: Líneas 1-199
Tipo: "use client" (Client Component) ❌
Protección: INCOMPLETA ⚠️
```

**Problema**:
- 📱 Es un componente cliente
- ⏳ La validación ocurre en la `action` (lado servidor)
- 👀 El formulario se carga antes de la validación
- 🔓 Usuario no autorizado puede VER el formulario

**Impacto**:
- Usuario aquilaroja99 puede navegar a `/dashboard/comites/nuevo`
- Ve el formulario de crear comité
- Aunque no puede enviarlo (validado en action), la UI está expuesta

**Timeline de inseguridad**:
```
1. Navegación a /dashboard/comites/nuevo
2. ⏳ Componente cliente se carga
3. 👀 Formulario visible en pantalla
4. ❌ Usuario intenta crear comité
5. ✅ Server action rechaza (insuficiente)
   - Pero la información ya fue expuesta
   - Si hay bugs en la validación de la action...
```

**Solución**:
```typescript
// ❌ ANTES: "use client" (inseguro)
"use client"

// ✅ DESPUÉS: Server Component (seguro)
import { requireAdminOrTesorero } from '@/lib/auth/permissions'

export default async function NuevoComitePage() {
  // Validar primero, antes de renderizar
  await requireAdminOrTesorero()
  
  // Si llegó aquí, es admin/tesorero
  // Ahora sí, mostrar el formulario
  return <ComiteForm />
}
```

---

## ⚠️ ALTO RIESGO: Páginas Bajo `/dashboard/comites/[id]`

### Validación Incompleta
```
Archivos afectados:
- [id]/page.tsx (línea 24-60)
- [id]/ofrendas/page.tsx (línea 1-50)
- [id]/proyectos/page.tsx (línea 1-50)
```

**Problema**:
- Tienen validación MANUAL del acceso
- Repiten lógica de validación en cada página
- Propenso a errores y omisiones
- NO redirige, devuelve `notFound()`

**Ejemplo del código actual**:
```typescript
// ⚠️ ANTES: Manual y repetitivo
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

if (!hasAccess) {
  return notFound() // ❌ No redirige, solo 404
}
```

**Riesgos**:
- Error en un IF → acceso no autorizado
- Mantenimiento difícil
- Inconsistencia entre páginas

**Solución**:
```typescript
// ✅ DESPUÉS: Centralizado y seguro
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

const access = await requireComiteAccess(id)
// ✅ Si no tiene acceso, automáticamente redirige
// ✅ No necesita validación adicional
```

---

## ✅ BIEN IMPLEMENTADO

### `/dashboard/comites/[id]/dashboard`
```
Archivo: src/app/dashboard/comites/[id]/dashboard/page.tsx
Línea: 17, 36
Protección: ✅ CORRECTA
```

**Qué hace bien**:
```typescript
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

const access = await requireComiteAccess(id)
// ✅ Valida automáticamente
// ✅ Redirige a sin-acceso si no autoriza
// ✅ Una sola llamada, una sola validación
```

**Este es el patrón a seguir en todas partes** ⭐

---

## 📋 Tabla Comparativa de Protección

| Página | Archivo | Protección | Estado |
|--------|---------|-----------|--------|
| `/dashboard` | `dashboard/page.tsx` | `requireAdminOrTesorero()` | ✅ |
| `/dashboard/comites` | `comites/page.tsx` | NINGUNA | ❌ **CRÍTICA** |
| `/dashboard/comites/nuevo` | `comites/nuevo/page.tsx` | Action only | ❌ **CRÍTICA** |
| `/dashboard/comites/[id]` | `comites/[id]/page.tsx` | Manual | ⚠️ |
| `/dashboard/comites/[id]/dashboard` | `comites/[id]/dashboard/page.tsx` | `requireComiteAccess()` | ✅ |
| `/dashboard/comites/[id]/ofrendas` | `comites/[id]/ofrendas/page.tsx` | Manual | ⚠️ |
| `/dashboard/comites/[id]/proyectos` | `comites/[id]/proyectos/page.tsx` | Manual | ⚠️ |
| `/dashboard/propositos` | `propositos/page.tsx` | `requireAdminOrTesorero()` | ✅ |

---

## 🔗 Botones de Navegación Problemáticos

### Dónde aparece el link "Volver a Comités"

```
1. src/app/dashboard/comites/[id]/page.tsx:95
   ↳ href="/dashboard/comites" (❌ NO PROTEGIDA)

2. src/app/dashboard/comites/[id]/dashboard/page.tsx:81
   ↳ href="/dashboard/comites" (❌ NO PROTEGIDA)

3. src/app/dashboard/comites/nuevo/page.tsx:65
   ↳ href="/dashboard/comites" (❌ NO PROTEGIDA)
```

**El botón está bien, el problema es la PÁGINA DE DESTINO**

---

## 🔐 Ausencia de RLS en Base de Datos

### Situación Actual
```sql
-- Sin políticas de fila
-- Cualquiera puede consultar directamente la API
SELECT * FROM comites;
SELECT * FROM comite_usuarios;
```

### Riesgo
- Usuario técnico podría hacer queries directas a Supabase
- Si el JWT es válido pero los permisos están mal en BD...
- API expuesta sin validación de datos

### Necesario
```sql
-- Necesarias políticas RLS en:
✅ comites
✅ comite_usuarios
✅ comite_proyectos
✅ comite_votos
✅ comite_ofrendas
✅ comite_gastos
```

---

## 📈 Matriz de Riesgo

### Por Severidad
```
🔴 CRÍTICA (Implementar hoy):
  - /dashboard/comites (no protegida)
  - /dashboard/comites/nuevo (protección incompleta)

🟠 ALTA (Implementar esta semana):
  - Validación inconsistente en [id] subpáginas
  - Falta RLS en base de datos

🟡 MEDIA (Implementar en 2 semanas):
  - Función centralizada de permisos
  - Tests de seguridad
```

### Por Impacto
```
ACCESO NO AUTORIZADO:
  - Alta probabilidad en /dashboard/comites
  - Media probabilidad en /dashboard/comites/nuevo

INFORMACIÓN EXPUESTA:
  - Alta: Datos de todos los comités
  - Media: Configuración de nuevo comité

MODIFICACIÓN NO AUTORIZADA:
  - Baja: Validación en actions funciona
  - Media: Sin RLS en BD
```

---

## ✨ Recomendaciones Inmediatas

### Hoy (Máximo prioridad)
1. [ ] Agregar `requireAdminOrTesorero()` en `/dashboard/comites/page.tsx`
2. [ ] Convertir `/dashboard/comites/nuevo` a Server Component
3. [ ] Testear con usuario aquilaroja99

### Esta semana
4. [ ] Estandarizar todas las páginas [id] con `requireComiteAccess()`
5. [ ] Implementar RLS en BD (tablas de comités)
6. [ ] Tests de seguridad

### Próximas semanas
7. [ ] Función `verificarPermisosComite()` centralizada
8. [ ] Documentación actualizada
9. [ ] Auditoría de seguridad completa

---

## 📚 Referencias Internas

- **Plan completo**: Ver `PLAN_ENRUTAMIENTO_SEGURO_COMITES.md`
- **Autenticación**: Ver `docs/AUTHENTICATION.md`
- **Histórico**: Ver `CORRECCION_PERMISOS_SIDEBAR.md`
- **Funciones de permisos**: Ver `src/lib/auth/permissions.ts` y `comite-permissions.ts`

