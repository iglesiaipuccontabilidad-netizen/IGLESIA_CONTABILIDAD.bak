# 🔄 Diagrama de Flujos de Acceso - Antes y Después

---

## 📍 FLUJO ACTUAL (CON BUGS)

### Usuario: aquilaroja99 (tesorero en DECOM)

```
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO: aquilaroja99@gmail.com (Rol: usuario, Comité: DECOM)  │
└─────────────────────────────────────────────────────────────────┘

INTENTO 1: Acceder a /dashboard/comites/[id] (su comité)
════════════════════════════════════════════════════════════════
 1. Usuario en navegador
    └─→ GET /dashboard/comites/e039ace3-cb8d-478a-a572-5ab458976581

 2. Page.tsx valida acceso (BIEN)
    ├─→ isAdmin = false (no es admin/tesorero)
    └─→ Busca en comite_usuarios
         └─→ ✅ Encontrado (tesorero en DECOM)

 3. Renderiza página
    ├─→ Ver info del comité
    ├─→ Ver miembros
    ├─→ Ver datos financieros
    └─→ Botón "Volver a Comités" ← AQUÍ VIENE EL PROBLEMA


INTENTO 2: Click en "Volver a Comités"
════════════════════════════════════════════════════════════════
 1. Botón navega a /dashboard/comites (sin validar acceso)
    └─→ href="/dashboard/comites"

 2. ComitesPage.tsx NO VALIDA ACCESO ❌
    ├─→ Verifica autenticación (✅ user existe)
    ├─→ ⚠️ PROBLEMA: No verifica rol
    └─→ ⚠️ No llama a requireAdminOrTesorero()

 3. Renderiza la página completa
    ├─→ ✅ VE LISTADO DE TODOS LOS COMITÉS
    ├─→ ✅ VE ESTADÍSTICAS TOTALES
    ├─→ ✅ VE COMITÉS A LOS QUE NO PERTENECE
    ├─→ ✅ VE BOTÓN "NUEVO COMITÉ" (sin poder usarlo)
    └─→ ❌ NO DEBERÍA VER NADA DE ESTO

 4. Usuario confundido
    └─→ "¿Por qué veo esto si solo soy tesorero de comité?"


INTENTO 3: Click en "Crear Nuevo Comité"
════════════════════════════════════════════════════════════════
 1. Navega a /dashboard/comites/nuevo

 2. Es un "use client" component ⚠️
    ├─→ Carga la página
    ├─→ Renderiza formulario
    ├─→ ❌ Usuario VE el formulario
    └─→ ⚠️ Validación ocurre solo al enviar

 3. Usuario intenta enviar
    └─→ Server action valida (✅ rechaza)
        └─→ Pero la información ya fue expuesta


INTENTO 4: Acceder a sub-página de comité
════════════════════════════════════════════════════════════════
 1. GET /dashboard/comites/e039ace3-cb8d-478a-a572-5ab458976581/ofrendas

 2. Page.tsx valida manualmente (con muchos if/else)
    ├─→ Obtiene usuario
    ├─→ Obtiene rol
    ├─→ Obtiene datos de comite_usuarios
    ├─→ Valida hasAccess
    └─→ Redirige si no tiene acceso

 3. ⚠️ PROBLEMA: Validación manual repetida
    └─→ Cada página valida de forma diferente
    └─→ Propenso a errores
    └─→ Difícil de mantener
```

---

## ✅ FLUJO DESEADO (DESPUÉS DE FIXES)

### Usuario: aquilaroja99 (tesorero en DECOM)

```
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO: aquilaroja99@gmail.com (Rol: usuario, Comité: DECOM)  │
└─────────────────────────────────────────────────────────────────┘

INTENTO 1: Acceder a /dashboard/comites/[id] (su comité)
════════════════════════════════════════════════════════════════
 1. Usuario en navegador
    └─→ GET /dashboard/comites/e039ace3-cb8d-478a-a572-5ab458976581

 2. Page.tsx valida acceso con requireComiteAccess()
    ├─→ Centralizado ✅
    ├─→ Automático ✅
    └─→ Redirige si no autoriza ✅

 3. Renderiza página
    ├─→ Ver info del comité
    ├─→ Ver miembros
    ├─→ Ver datos financieros
    └─→ Botón "Volver a Comités" (ahora seguro)


INTENTO 2: Click en "Volver a Comités"
════════════════════════════════════════════════════════════════
 1. Botón navega a /dashboard/comites

 2. ComitesPage.tsx VALIDA ACCESO ✅
    ├─→ Primera línea: await requireAdminOrTesorero()
    ├─→ Si no es admin/tesorero → REDIRECCIÓN AUTOMÁTICA
    └─→ No continúa el código

 3. Usuario aquilaroja99:
    ├─→ requireAdminOrTesorero() se ejecuta
    ├─→ Usuario NO es admin/tesorero
    ├─→ Busca comités del usuario
    ├─→ Encuentra DECOM
    ├─→ 🔄 REDIRECCIONA a /dashboard/comites/e039ace3...
    └─→ Vuelve a ver su comité (loop seguro)

 4. No ve la página de listado
    └─→ ✅ CORRECTO


INTENTO 3: Click en "Crear Nuevo Comité"
════════════════════════════════════════════════════════════════
 1. Navega a /dashboard/comites/nuevo

 2. Es un Server Component ✅
    ├─→ await requireAdminOrTesorero() al inicio
    ├─→ Usuario NO es admin/tesorero
    ├─→ 🔄 REDIRECCIONA ANTES DE RENDERIZAR
    └─→ Nunca ve el formulario

 3. Usuario redirigido a su comité
    └─→ ✅ CORRECTO


INTENTO 4: Acceder a sub-página de comité
════════════════════════════════════════════════════════════════
 1. GET /dashboard/comites/e039ace3-cb8d-478a-a572-5ab458976581/ofrendas

 2. Page.tsx valida acceso con requireComiteAccess()
    ├─→ Primera línea: const access = await requireComiteAccess(id)
    ├─→ Centralizado ✅
    ├─→ Automático ✅
    ├─→ Redirige si no autoriza ✅
    └─→ Consistente con dashboard ✅

 3. Renderiza página
    └─→ ✅ Usuario ve sus ofrendas
```

---

## 🔀 FLUJO COMPARATIVO: Validación Manual vs Centralizada

### ❌ ANTES: Validación Manual (Problema)

```
/dashboard/comites/[id]/page.tsx
┌────────────────────────────────────────┐
│ const user = supabase.auth.getUser()   │
│ if (!user) return notFound()           │
│                                        │
│ const userData = ...select('rol')      │
│ const isAdmin = rol === 'admin'...     │
│                                        │
│ let hasAccess = isAdmin                │
│ if (!isAdmin) {                        │
│   const comiteUsuario = ...select()    │
│   hasAccess = !!comiteUsuario          │
│ }                                      │
│                                        │
│ if (!hasAccess) return notFound()      │
└────────────────────────────────────────┘

/dashboard/comites/[id]/ofrendas/page.tsx
┌────────────────────────────────────────┐
│ const user = supabase.auth.getUser()   │ ← Repetido
│ if (!user) return notFound()           │ ← Repetido
│                                        │
│ const userData = ...select('rol')      │ ← Repetido
│ const isAdmin = rol === 'admin'...     │ ← Repetido
│                                        │
│ let hasAccess = isAdmin                │ ← Repetido
│ if (!isAdmin) {                        │ ← Repetido
│   const comiteUsuario = ...select()    │ ← Repetido
│   hasAccess = !!comiteUsuario          │ ← Repetido
│ }                                      │ ← Repetido
│                                        │
│ if (!hasAccess) return notFound()      │ ← Repetido
└────────────────────────────────────────┘

⚠️ PROBLEMAS:
  1. Código duplicado (DRY violation)
  2. Propenso a errores en mantenimiento
  3. Difícil de auditar
  4. Si hay bug, afecta múltiples lugares
```

### ✅ DESPUÉS: Validación Centralizada (Solución)

```
/dashboard/comites/[id]/page.tsx
┌────────────────────────────────────────┐
│ const access =                         │
│   await requireComiteAccess(id)        │ ← 1 línea, todo validado
└────────────────────────────────────────┘

/dashboard/comites/[id]/ofrendas/page.tsx
┌────────────────────────────────────────┐
│ const access =                         │
│   await requireComiteAccess(id)        │ ← 1 línea, consistente
└────────────────────────────────────────┘

/dashboard/comites/[id]/proyectos/page.tsx
┌────────────────────────────────────────┐
│ const access =                         │
│   await requireComiteAccess(id)        │ ← 1 línea, consistente
└────────────────────────────────────────┘

✅ VENTAJAS:
  1. Código limpio y reutilizable
  2. Single source of truth
  3. Fácil auditar
  4. Bug fix en un solo lugar
```

---

## 🔐 COMPARACIÓN: Rutas Seguras vs Inseguras

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANTES DE FIXES (INSEGURO)                   │
├─────────────────────────────────────────────────────────────────┤

Usuario aquilaroja99:
│
├─→ /dashboard
│   └─ requireAdminOrTesorero() ✅
│       ├─ No es admin/tesorero
│       └─ Redirige a /dashboard/comites/[id] ✅

├─→ /dashboard/comites ❌ PROBLEMA
│   └─ Sin validación de rol
│       ├─ Verifica solo autenticación
│       └─ VE LISTA COMPLETA DE COMITÉS ❌

├─→ /dashboard/comites/nuevo ❌ PROBLEMA
│   └─ Client component
│       ├─ VE FORMULARIO ❌
│       └─ Validación solo al enviar

├─→ /dashboard/comites/[id]
│   └─ Validación manual ⚠️
│       ├─ Funciona pero repetitivo
│       └─ VE SU COMITÉ ✅

├─→ /dashboard/comites/[id]/ofrendas
│   └─ Validación manual ⚠️
│       ├─ Funciona pero repetitivo
│       └─ VE OFRENDAS ✅

└─→ /dashboard/propositos
    └─ requireAdminOrTesorero() ✅
        ├─ No es admin/tesorero
        └─ Redirige ✅

────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                   DESPUÉS DE FIXES (SEGURO)                     │
├─────────────────────────────────────────────────────────────────┤

Usuario aquilaroja99:
│
├─→ /dashboard
│   └─ requireAdminOrTesorero() ✅
│       ├─ No es admin/tesorero
│       └─ Redirige a /dashboard/comites/[id] ✅

├─→ /dashboard/comites ✅ FIJA
│   └─ requireAdminOrTesorero() ✅
│       ├─ No es admin/tesorero
│       └─ Redirige a /dashboard/comites/[id] ✅

├─→ /dashboard/comites/nuevo ✅ FIJA
│   └─ Server component + requireAdminOrTesorero() ✅
│       ├─ No es admin/tesorero
│       └─ Redirige ANTES de renderizar ✅

├─→ /dashboard/comites/[id]
│   └─ requireComiteAccess(id) ✅
│       ├─ Centralizado
│       └─ VE SU COMITÉ ✅

├─→ /dashboard/comites/[id]/ofrendas
│   └─ requireComiteAccess(id) ✅
│       ├─ Centralizado
│       └─ VE OFRENDAS ✅

└─→ /dashboard/propositos
    └─ requireAdminOrTesorero() ✅
        ├─ No es admin/tesorero
        └─ Redirige ✅

✅ SEGURIDAD CONSISTENTE EN TODAS PARTES
```

---

## 🔄 FLUJO DE REDIRECCIÓN AUTOMÁTICA

```
┌──────────────────────────────────────────────────────────────┐
│                   requireAdminOrTesorero()                   │
└──────────────────────────────────────────────────────────────┘

ENTRADA:
  └─ Usuario intenta acceder a página admin-only

PASO 1: Obtener usuario de autenticación
  ├─ Sin usuario → Redirige a /login
  └─ Con usuario → Continúa

PASO 2: Obtener rol del usuario
  ├─ Sin usuario en DB → Redirige a /login
  └─ Con usuario en DB → Continúa

PASO 3: Validar rol
  ├─ Rol = 'admin' OR 'tesorero' → ✅ Permite acceso
  └─ Rol ≠ 'admin' y ≠ 'tesorero' → Continúa a PASO 4

PASO 4: Buscar comités del usuario
  ├─ Tiene comités → Redirige a su primer comité
  └─ Sin comités → Redirige a /sin-acceso

┌──────────────────────────────────────────────────────────────┐
│                   requireComiteAccess(id)                    │
└──────────────────────────────────────────────────────────────┘

ENTRADA:
  └─ Usuario intenta acceder a /dashboard/comites/[id]/*

PASO 1: Obtener usuario
  ├─ Sin usuario → Redirige a /login
  └─ Con usuario → Continúa

PASO 2: Validar rol
  ├─ admin O tesorero global → ✅ Acceso completo
  └─ usuario → Continúa a PASO 3

PASO 3: Validar comité
  ├─ Pertenece al comité (activo) → ✅ Acceso permitido
  └─ No pertenece → Redirige a /sin-acceso

SALIDA:
  ├─ ✅ hasAccess = true
  ├─ isAdmin = true/false
  └─ rolEnComite = 'lider' | 'tesorero' | 'secretario' | null
```

---

## 📊 MATRIZ DE ACCESO

### Usuario Regular (Rol: usuario, Comité: DECOM tesorero)

|  | ADMIN | TESORERO | USUARIO + COMITÉ |
|---|---|---|---|
| **Ver todas las propuestas** | ✅ | ✅ | ❌ |
| **Ver todos los votos** | ✅ | ✅ | ❌ |
| **Ver todos los miembros** | ✅ | ✅ | ❌ |
| **Crear nuevo comité** | ✅ | ❌ | ❌ |
| **Ver comité específico** | ✅ | ✅ | ✅ (solo el suyo) |
| **Ver proyectos de comité** | ✅ | ✅ | ✅ (solo el suyo) |
| **Registrar pago en comité** | ✅ | ✅ | ✅ (si es tesorero) |
| **Ver ofrendas de comité** | ✅ | ✅ | ✅ (solo el suyo) |
| **Crear proyecto en comité** | ✅ | ✅ | ✅ (solo el suyo, si es líder) |
| **Ver listado de comités** | ✅ | ✅ | ❌ |
| **Acceder a /dashboard** | ✅ | ✅ | ❌ (redirige) |

---

## 🎯 RESULTADO FINAL

```
┌──────────────────────────────────────────────────────────────────┐
│                      SEGURIDAD IMPLEMENTADA                      │
├──────────────────────────────────────────────────────────────────┤

CAPAS DE VALIDACIÓN:
  1. ✅ Validación en Server Components (Next.js)
  2. ✅ Validación en Server Actions
  3. ✅ Validación en Base de Datos (RLS - por implementar)
  4. ✅ Código consistente y centralizado

PROTECCIÓN CONTRA:
  ✅ Acceso no autorizado a páginas
  ✅ Exposición de información
  ✅ Navegación incorrecta
  ✅ Cliente directo (cuando RLS esté implementado)

USUARIO DESPUÉS DE FIXES:
  aquilaroja99@gmail.com
  └─ Redirigido automáticamente
     └─ Solo ve comité DECOM
        └─ Seguridad garantizada ✅

└──────────────────────────────────────────────────────────────────┘
```

