# 🔧 Guía de Implementación: Correcciones de Seguridad paso a paso

**Objetivo**: Reparar las vulnerabilidades identificadas  
**Dificultad**: Baja-Media  
**Tiempo estimado**: 2-3 horas  

---

## 1️⃣ FIX CRÍTICA #1: Proteger `/dashboard/comites`

### 🔴 Problema
Usuarios de comité pueden ver la lista de TODOS los comités.

### ✅ Solución

**Archivo**: `src/app/dashboard/comites/page.tsx`

**ANTES**:
```typescript
import { createClient } from '@/lib/supabase/server'
import { ComiteCard } from '@/components/comites/ComiteCard'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ComitesPage() {
  const supabase = await createClient()

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg">
          Debes iniciar sesión para ver los comités.
        </div>
      </div>
    )
  }

  // ⚠️ PROBLEMA: Solo verifica autenticación, no rol
  // Obtener rol del usuario
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

  // El resto del código sigue ejecutándose AUNQUE NO SEA ADMIN
  // ...
}
```

**DESPUÉS**:
```typescript
import { createClient } from '@/lib/supabase/server'
import { ComiteCard } from '@/components/comites/ComiteCard'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import { requireAdminOrTesorero } from '@/lib/auth/permissions'  // ✅ AGREGAR

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ComitesPage() {
  // ✅ AGREGAR: Validar ANTES de cualquier código
  await requireAdminOrTesorero()
  
  // Si llegó aquí, garantizado que es admin o tesorero
  // El usuario será redirigido automáticamente si no cumple
  
  const supabase = await createClient()

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg">
          Debes iniciar sesión para ver los comités.
        </div>
      </div>
    )
  }

  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

  // El resto del código...
}
```

### 📝 Checklist
- [ ] Agregar import de `requireAdminOrTesorero`
- [ ] Llamar `await requireAdminOrTesorero()` al inicio
- [ ] Verificar que está al inicio de la función (antes de otros códigos)
- [ ] Testear: usuario aquilaroja99 intenta acceder → debe redirigir

---

## 2️⃣ FIX CRÍTICA #2: Proteger `/dashboard/comites/nuevo`

### 🔴 Problema
Es un client component, permite que se cargue el formulario antes de validar.

### ✅ Solución

**Archivo**: `src/app/dashboard/comites/nuevo/page.tsx`

**ANTES**:
```typescript
"use client"  // ❌ PROBLEMA: Component cliente sin validación

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createComite } from "@/app/actions/comites-actions"
// ... imports

export default function NuevoComitePage() {
  // El formulario se renderiza sin validar permisos
  // La validación ocurre solo cuando intenta enviar
}
```

**DESPUÉS** - Opción A (Recomendado): Server Component
```typescript
// ❌ REMOVIDO: "use client"

import { useState } from "react"  // ❌ Removido (no needed en server)
import { useRouter } from "next/navigation"  // ❌ Removido
import { createComite } from "@/app/actions/comites-actions"
import { requireAdminOrTesorero } from "@/lib/auth/permissions"  // ✅ AGREGAR
import { Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import * as z from "zod"

const comiteSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  descripcion: z.string(),
  estado: z.enum(["activo", "inactivo"]),
})

type ComiteFormData = z.infer<typeof comiteSchema>

export default async function NuevoComitePage() {
  // ✅ AGREGAR: Validar ANTES de renderizar
  await requireAdminOrTesorero()
  
  // ✅ AGREGAR: Ahora usar server action + client component separados
  return <NuevoComiteForm />
}

// ✅ AGREGAR: Client component solo para el formulario
"use client"
function NuevoComiteForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: ComiteFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createComite(data)

      if (!result.success) {
        throw new Error(result.error || "Error al crear el comité")
      }

      router.push("/dashboard/comites")
      router.refresh()
    } catch (err: any) {
      console.error("Error al crear comité:", err)
      setError(err.message || "Error al crear el comité")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Formulario */}
      {/* ... */}
    </div>
  )
}
```

### 📝 Checklist
- [ ] Remover `"use client"` de la parte superior
- [ ] Agregar `import { requireAdminOrTesorero }`
- [ ] Llamar `await requireAdminOrTesorero()` al inicio
- [ ] Crear componente `NuevoComiteForm` como "use client"
- [ ] Retornar ese componente desde la página principal
- [ ] Testear: usuario aquilaroja99 intenta acceder → debe redirigir

---

## 3️⃣ FIX ALTA: Estandarizar `/dashboard/comites/[id]/*`

### 🔴 Problema
Cada página sub-comité valida manualmente. Inconsistente y propenso a errores.

### ✅ Solución General

**Patrón a aplicar en todas las páginas**:

```typescript
// ❌ ANTES: Validación manual
const { data: userData } = await supabase
  .from('usuarios')
  .select('rol')
  .eq('id', user.id)
  .single()

const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

let hasAccess = isAdmin
let rolEnComite = null

if (!isAdmin) {
  const { data: comiteUsuario } = await supabase
    .from('comite_usuarios')
    .select('rol')
    .eq('comite_id', id)
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .single()

  hasAccess = !!comiteUsuario
  rolEnComite = comiteUsuario?.rol || null
}

if (!hasAccess) {
  return notFound()
}

// ✅ DESPUÉS: Validación centralizada
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

const access = await requireComiteAccess(id)

// Ya está validado automáticamente:
// - access.hasAccess = true
// - access.rolEnComite = 'lider' | 'tesorero' | 'secretario' | null
// - access.isAdmin = true | false
// Si no tenía acceso, ya fue redirigido automáticamente
```

### Páginas a Actualizar:

#### 3.1 `/dashboard/comites/[id]/page.tsx`
**Ubicación del cambio**: Línea ~24-70

```typescript
// ANTES
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

  // PROBLEMA: No valida si no es admin

// DESPUÉS
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export default async function ComiteDetallePage({ params }: PageProps) {
  const { id } = await params
  
  // ✅ Validar acceso automáticamente
  const access = await requireComiteAccess(id)
  
  const supabase = await createClient()

  // Obtener comité...
  // El usuario garantizado tiene acceso a este comité
}
```

#### 3.2 `/dashboard/comites/[id]/ofrendas/page.tsx`
**Ubicación del cambio**: Línea ~1-45

```typescript
// ANTES
export default async function OfrendasComitePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

  let hasAccess = isAdmin
  let rolEnComite = null

  if (!isAdmin) {
    const { data: comiteUsuario } = await supabase
      .from('comite_usuarios')
      .select('rol')
      .eq('comite_id', id)
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .single()

    hasAccess = !!comiteUsuario
    rolEnComite = comiteUsuario?.rol || null
  }

  // PROBLEMA: Repetir validación en cada página

// DESPUÉS
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export default async function OfrendasComitePage({ params }: PageProps) {
  const { id } = await params
  
  // ✅ Una línea, validación automática
  const access = await requireComiteAccess(id)
  
  const supabase = await createClient()

  // Ahora access.hasAccess = true garantizado
  // access.rolEnComite = su rol en el comité
}
```

#### 3.3 `/dashboard/comites/[id]/proyectos/page.tsx`
**Ubicación del cambio**: Línea ~1-45

*Aplicar el mismo patrón que ofrendas*

#### 3.4 Otras páginas `/dashboard/comites/[id]/*`
- `/dashboard/comites/[id]/gastos/page.tsx`
- `/dashboard/comites/[id]/miembros/page.tsx`
- `/dashboard/comites/[id]/votos/page.tsx`
- `/dashboard/comites/[id]/proyectos/[proyectoId]/page.tsx`
- etc.

*Aplicar el mismo patrón*

### 📝 Checklist
- [ ] Agregar `import { requireComiteAccess }`
- [ ] Reemplazar validación manual con `const access = await requireComiteAccess(id)`
- [ ] Remover el bloque `if (!user)`, `if (!usuario)`, etc.
- [ ] Remover variable `isAdmin` (está en `access.isAdmin`)
- [ ] Remover variable `rolEnComite` (está en `access.rolEnComite`)
- [ ] Remover bloque `if (!hasAccess) return notFound()`
- [ ] Reemplazar referencias a `isAdmin` con `access.isAdmin`
- [ ] Reemplazar referencias a `rolEnComite` con `access.rolEnComite`

---

## 4️⃣ Verificación Post-Implementación

### Test 1: Usuario de Comité No Puede Ver Listado
```
Usuario: aquilaroja99@gmail.com
Rol: usuario
Comité: DECOM (tesorero)

1. Intenta acceder a /dashboard/comites
2. Esperado: Redirige a /dashboard/comites/e039ace3-cb8d-478a-a572-5ab458976581
3. ✅ Correcto si aparece el dashboard de DECOM
```

### Test 2: Usuario de Comité No Puede Crear Comité
```
Usuario: aquilaroja99@gmail.com

1. Intenta acceder a /dashboard/comites/nuevo
2. Esperado: Redirige a su comité o a /dashboard/sin-acceso
3. ✅ Correcto si NO ve el formulario
```

### Test 3: Admin SÍ Puede Ver Todo
```
Usuario: (admin de prueba)

1. Accede a /dashboard/comites
2. ✅ Correcto si ve el listado completo

3. Accede a /dashboard/comites/nuevo
4. ✅ Correcto si ve el formulario

5. Puede ver todos los botones de editar/eliminar
```

### Test 4: Botón "Volver a Comités"
```
Para usuario aquilaroja99:

1. Desde /dashboard/comites/[id] hace click en "Volver a Comités"
2. Esperado: Redirige a su comité (NOT a /dashboard/comites)
3. ✅ Correcto si aparece dashboard del comité
```

---

## 5️⃣ Archivo Resumen de Cambios

```
CAMBIOS A REALIZAR:

src/app/dashboard/comites/page.tsx
├─ Agregar import requireAdminOrTesorero
├─ Llamar requireAdminOrTesorero() al inicio
└─ Testear

src/app/dashboard/comites/nuevo/page.tsx
├─ Remover "use client" de la parte superior
├─ Agregar import requireAdminOrTesorero
├─ Crear componente NuevoComiteForm con "use client"
├─ Llamar requireAdminOrTesorero() en página principal
└─ Testear

src/app/dashboard/comites/[id]/page.tsx
├─ Agregar import requireComiteAccess
├─ Reemplazar validación manual con requireComiteAccess(id)
├─ Actualizar referencias a isAdmin → access.isAdmin
└─ Testear

src/app/dashboard/comites/[id]/ofrendas/page.tsx
├─ Agregar import requireComiteAccess
├─ Reemplazar validación manual con requireComiteAccess(id)
└─ Testear

src/app/dashboard/comites/[id]/proyectos/page.tsx
├─ Agregar import requireComiteAccess
├─ Reemplazar validación manual con requireComiteAccess(id)
└─ Testear

src/app/dashboard/comites/[id]/gastos/page.tsx
├─ Agregar import requireComiteAccess
├─ Reemplazar validación manual con requireComiteAccess(id)
└─ Testear

src/app/dashboard/comites/[id]/miembros/page.tsx
├─ Agregar import requireComiteAccess
├─ Reemplazar validación manual con requireComiteAccess(id)
└─ Testear

src/app/dashboard/comites/[id]/votos/page.tsx
├─ Agregar import requireComiteAccess
├─ Reemplazar validación manual con requireComiteAcceso(id)
└─ Testear

TOTAL: ~9 archivos para actualizar
TIEMPO ESTIMADO: 2-3 horas
COMPLEJIDAD: Baja (cambios repetitivos)
```

---

## 🎯 Orden Recomendado de Implementación

1. **Primero** (15 min): FIX #1 - `/dashboard/comites` + test
2. **Segundo** (30 min): FIX #2 - `/dashboard/comites/nuevo` + test
3. **Tercero** (1-2 horas): FIX #3 - Todas las sub-páginas + test cada una
4. **Cuarto** (30 min): Verificación final y pruebas de usuario

---

## ⚡ Comandos Git Útiles

```bash
# Hacer commit por cada fix
git add src/app/dashboard/comites/page.tsx
git commit -m "fix: proteger /dashboard/comites con requireAdminOrTesorero"

git add src/app/dashboard/comites/nuevo/page.tsx
git commit -m "fix: convertir /dashboard/comites/nuevo a server component"

# Crear rama para cambios
git checkout -b fix/comite-access-control
# Después de todos los cambios:
git push origin fix/comite-access-control
```

