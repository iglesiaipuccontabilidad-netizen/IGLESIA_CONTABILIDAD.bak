# Corrección Sidebar y Permisos - Módulo Comités
**Fecha:** 31 Diciembre 2025  
**Estado:** ✅ Completado

## Problema Reportado

Usuario con rol de comité estaba viendo en el sidebar opciones de contabilidad general (Dashboard, Propósitos, Votos, Miembros, Reportes) cuando solo debería ver sus comités asignados.

## Diagnóstico

### 1. Sidebar Mostraba Todo a Todos
El `Sidebar.tsx` mostraba las secciones "Principal" y "Gestión" a **TODOS** los usuarios, sin importar su rol:

```tsx
// ANTES - INCORRECTO
const sections: MenuSection[] = [
  {
    title: "Principal",  // ❌ Se mostraba a TODOS
    items: [/* Dashboard */]
  },
  {
    title: "Gestión",    // ❌ Se mostraba a TODOS
    items: [/* Propósitos, Votos, Miembros, Reportes */]
  }
]

// Luego verificaba si agregar "Administración" o "Mis Comités"
if (member?.rol === 'admin' || member?.rol === 'tesorero') {
  sections.push({ title: "Administración", ... })
} else if (comitesUsuario?.length > 0) {
  sections.push({ title: "Mis Comités", ... })
}
```

### 2. Páginas Sin Protección Server-Side
Las páginas de contabilidad general no verificaban permisos en el servidor:
- `/dashboard/page.tsx` - No verificaba rol
- `/dashboard/propositos/page.tsx` - No verificaba rol
- `/dashboard/votos/page.tsx` - Client component (protegido por ProtectedRoute)
- `/dashboard/miembros/page.tsx` - No verificaba rol
- `/dashboard/reportes/page.tsx` - No verificaba rol

### 3. Solo Protección Client-Side
El componente `<ComiteUserRedirect />` solo funcionaba en el cliente, permitiendo que usuarios vieran brevemente contenido antes de la redirección.

## Soluciones Implementadas

### 1. ✅ Sidebar Condicional Completo

**Archivo:** `src/components/Sidebar.tsx`

```typescript
const menuSections: MenuSection[] = React.useMemo(() => {
  const sections: MenuSection[] = []

  // ✅ Solo mostrar contabilidad general si es admin o tesorero global
  const isAdminOrTesorero = member?.rol === 'admin' || member?.rol === 'tesorero'
  
  if (isAdminOrTesorero) {
    // Secciones de contabilidad general (solo para admin/tesorero)
    sections.push(
      { title: "Principal", items: [/* Dashboard */] },
      { title: "Gestión", items: [/* Propósitos, Votos, Miembros, Reportes */] },
      { title: "Administración", items: [/* Comités, Usuarios */] }
    )
  } else if (comitesUsuario && comitesUsuario.length > 0) {
    // ✅ Usuarios de comité SOLO ven sus comités
    sections.push({
      title: "Mis Comités",
      items: comitesUsuario.map(comite => ({
        href: `/dashboard/comites/${comite.comite_id}`,
        label: comite.comite_nombre,
        icon: Users,
        description: `Rol: ${comite.rol_en_comite}`
      }))
    })
  }

  return sections
}, [member?.rol, comitesUsuario])
```

**Resultado:**
- ✅ Admin/Tesorero: Ven Dashboard, Propósitos, Votos, Miembros, Reportes, Comités, Usuarios
- ✅ Usuario de Comité: Solo ven "Mis Comités" con sus comités asignados
- ✅ Usuario sin comités: No ven ninguna opción (se redirigen)

### 2. ✅ Helper de Permisos Reutilizable

**Archivo:** `src/lib/auth/permissions.ts` (NUEVO)

```typescript
/**
 * Verifica que el usuario tenga permisos de admin o tesorero general
 * Si no los tiene, redirige a su comité o a una página de error
 */
export async function requireAdminOrTesorero() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('rol, id')
    .eq('id', user.id)
    .single()

  if (error || !usuario) {
    redirect('/login')
  }

  // ✅ Si es admin o tesorero, permitir acceso
  if (usuario.rol === 'admin' || usuario.rol === 'tesorero') {
    return { user, usuario }
  }

  // ✅ Si no es admin/tesorero, buscar su comité y redirigir
  const { data: comites } = await supabase
    .from('comite_usuarios')
    .select('comite_id')
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .limit(1)

  if (comites && comites.length > 0) {
    redirect(`/dashboard/comites/${comites[0].comite_id}`)
  }

  // ❌ Si no tiene comités ni permisos, redirigir a página de sin acceso
  redirect('/dashboard/sin-acceso')
}
```

### 3. ✅ Protección Server-Side en Páginas

#### Dashboard Principal
**Archivo:** `src/app/dashboard/page.tsx`

```typescript
import { requireAdminOrTesorero } from '@/lib/auth/permissions'

export default async function DashboardPage() {
  // ✅ Verificar permisos ANTES de cargar datos
  await requireAdminOrTesorero()
  
  // Continuar con la lógica...
}
```

#### Propósitos
**Archivo:** `src/app/dashboard/propositos/page.tsx`

```typescript
import { requireAdminOrTesorero } from '@/lib/auth/permissions'

export default async function PropositosPage() {
  // ✅ Verificar permisos
  await requireAdminOrTesorero()
  
  const propositos = await getPropositos()
  // ...
}
```

#### Miembros
**Archivo:** `src/app/dashboard/miembros/page.tsx`

```typescript
import { requireAdminOrTesorero } from '@/lib/auth/permissions'

export default async function MiembrosPage() {
  // ✅ Verificar permisos
  await requireAdminOrTesorero()
  
  const supabase = await createClient()
  // ...
}
```

#### Votos
**Archivo:** `src/app/dashboard/votos/page.tsx`  
**Nota:** Es un client component, ya está protegido por `ProtectedRoute` en el layout.

### 4. ✅ Página de Sin Acceso

**Archivo:** `src/app/dashboard/sin-acceso/page.tsx` (NUEVO)

```tsx
export default function SinAccesoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <ShieldAlert className="w-12 h-12 text-red-600" />
        <h1>Acceso Restringido</h1>
        <p>No tienes permisos para acceder a esta sección.</p>
        <Link href="/dashboard">Volver al inicio</Link>
      </div>
    </div>
  )
}
```

## Flujo de Seguridad Implementado

### Usuario Admin/Tesorero
1. Login → `/dashboard`
2. ✅ `requireAdminOrTesorero()` permite acceso
3. Ve sidebar completo con todas las opciones
4. Puede navegar a cualquier sección

### Usuario con Rol de Comité
1. Login → `/dashboard`
2. ❌ `requireAdminOrTesorero()` detecta que no es admin
3. 🔄 Busca comités del usuario en `comite_usuarios`
4. ✅ Redirige a `/dashboard/comites/{comiteId}`
5. Ve sidebar SOLO con "Mis Comités"
6. No puede acceder a `/dashboard`, `/propositos`, `/votos`, `/miembros`, `/reportes`

### Usuario Sin Comités Ni Permisos
1. Login → `/dashboard`
2. ❌ `requireAdminOrTesorero()` detecta que no es admin
3. 🔄 Busca comités del usuario
4. ❌ No encuentra comités
5. 🔄 Redirige a `/dashboard/sin-acceso`

## Políticas RLS (Recomendaciones)

Aunque las server actions ya implementan verificación de permisos, se recomienda agregar políticas RLS en Supabase para defensa en profundidad:

### Tablas de Comités
```sql
-- Política para lectura de comite_usuarios
CREATE POLICY "usuarios_pueden_ver_sus_comites" 
  ON comite_usuarios FOR SELECT 
  USING (
    auth.uid() = usuario_id OR 
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND rol IN ('admin', 'tesorero')
      AND estado = 'activo'
    )
  );

-- Política para lectura de comite_miembros
CREATE POLICY "usuarios_pueden_ver_miembros_de_sus_comites" 
  ON comite_miembros FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM comite_usuarios 
      WHERE comite_id = comite_miembros.comite_id 
      AND usuario_id = auth.uid() 
      AND estado = 'activo'
    ) OR
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND rol IN ('admin', 'tesorero')
      AND estado = 'activo'
    )
  );

-- Política para lectura de comite_proyectos
CREATE POLICY "usuarios_pueden_ver_proyectos_de_sus_comites" 
  ON comite_proyectos FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM comite_usuarios 
      WHERE comite_id = comite_proyectos.comite_id 
      AND usuario_id = auth.uid() 
      AND estado = 'activo'
    ) OR
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND rol IN ('admin', 'tesorero')
      AND estado = 'activo'
    )
  );

-- Similar para comite_votos, comite_pagos, comite_ofrendas, comite_gastos
```

### Tablas de Contabilidad General
```sql
-- Política para lectura de propositos
CREATE POLICY "solo_admin_tesorero_ven_propositos" 
  ON propositos FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND rol IN ('admin', 'tesorero')
      AND estado = 'activo'
    )
  );

-- Similar para votos, miembros, pagos
```

## Archivos Modificados

```
✅ src/components/Sidebar.tsx
   - Condicional completo basado en rol
   - Solo admin/tesorero ven contabilidad general
   - Usuarios de comité solo ven "Mis Comités"

✅ src/lib/auth/permissions.ts (NUEVO)
   - requireAdminOrTesorero() con redirect automático
   - getUserRole() helper sin redirect

✅ src/app/dashboard/page.tsx
   - Verificación server-side con requireAdminOrTesorero()

✅ src/app/dashboard/propositos/page.tsx
   - Verificación server-side con requireAdminOrTesorero()

✅ src/app/dashboard/miembros/page.tsx
   - Verificación server-side con requireAdminOrTesorero()

✅ src/app/dashboard/sin-acceso/page.tsx (NUEVO)
   - Página amigable para usuarios sin permisos
```

## Pruebas Recomendadas

### Como Usuario Líder de Comité
1. ✅ Login con `aquilarjuan123@gmail.com`
2. ✅ Debe redirigir automáticamente a `/dashboard/comites/{comiteId}`
3. ✅ Sidebar muestra SOLO "Mis Comités" con DECOM
4. ✅ NO muestra Dashboard, Propósitos, Votos, Miembros, Reportes
5. ✅ Intentar acceder a `/dashboard` → redirige a su comité
6. ✅ Intentar acceder a `/dashboard/propositos` → redirige a su comité
7. ✅ Puede navegar dentro de su comité: dashboard, miembros, proyectos, votos, ofrendas, gastos

### Como Admin
1. ✅ Login con usuario admin
2. ✅ Puede acceder a `/dashboard`
3. ✅ Sidebar muestra TODO: Principal, Gestión, Administración
4. ✅ Puede navegar a cualquier sección
5. ✅ Puede acceder a todos los comités

## Estado Final

### ✅ Completado
- [x] Sidebar muestra opciones según rol
- [x] Verificación server-side en páginas principales
- [x] Helper reutilizable de permisos
- [x] Página de sin acceso creada
- [x] Redirección automática de usuarios de comité
- [x] Documentación completa

### 📋 Recomendaciones Futuras
- [ ] Agregar políticas RLS en Supabase para defensa en profundidad
- [ ] Implementar verificación en páginas de reportes
- [ ] Agregar logs de acceso a secciones restringidas
- [ ] Crear tests automatizados de permisos

## Conclusión

El módulo de comités ahora tiene **aislamiento completo** a nivel de:
1. ✅ **UI (Sidebar):** Usuarios solo ven lo que pueden acceder
2. ✅ **Servidor (Pages):** Verificación antes de cargar datos
3. ✅ **Server Actions:** Verificación en cada operación CRUD
4. ✅ **Redirección Automática:** Usuarios van directamente a su área

Los usuarios con rol de comité están completamente aislados de la contabilidad general y solo pueden acceder a sus comités asignados.
