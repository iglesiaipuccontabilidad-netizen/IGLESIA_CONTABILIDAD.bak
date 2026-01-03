# ✅ Solución al Problema de Eliminación de Ofrendas

## 🔍 Problema Identificado
El usuario no podía eliminar ofrendas a pesar de tener los permisos adecuados en el frontend.

## 🎯 Causa Raíz
La tabla `comite_ofrendas` en Supabase **no tenía políticas RLS para UPDATE y DELETE**. Solo existían políticas para SELECT e INSERT.

### Políticas Existentes (antes del fix):
- ✅ `admins_tesoreros_view_all_ofrendas` - SELECT
- ✅ `users_view_own_comite_ofrendas` - SELECT  
- ✅ `treasurers_create_ofrendas` - INSERT
- ❌ **Faltaban políticas para UPDATE**
- ❌ **Faltaban políticas para DELETE**

## 🔧 Solución Implementada

### 1. **Migración de Base de Datos**
Archivo: `/supabase/migrations/20260104_add_update_delete_ofrendas_policies.sql`

```sql
-- Política UPDATE: Permite a admins, líderes y tesoreros actualizar
CREATE POLICY "leaders_treasurers_update_ofrendas"
  ON public.comite_ofrendas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND rol = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_ofrendas.comite_id
        AND usuario_id = auth.uid()
        AND rol IN ('lider', 'tesorero')
        AND estado = 'activo'
    )
  );

-- Política DELETE: Permite a admins, líderes y tesoreros eliminar
CREATE POLICY "leaders_treasurers_delete_ofrendas"
  ON public.comite_ofrendas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND rol = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_ofrendas.comite_id
        AND usuario_id = auth.uid()
        AND rol IN ('lider', 'tesorero')
        AND estado = 'activo'
    )
  );
```

### 2. **Mejoras en el Frontend**

#### A. Logs de Debugging en `OfrendasList.tsx`
```typescript
// Log al montar componente
console.log('🎯 OfrendasList - Props:', { 
  canManage, 
  isAdmin, 
  totalOfrendas 
})

// Log al hacer click en eliminar
onClick={() => {
  console.log('🗑️ Click en botón eliminar - Ofrenda ID:', ofrenda.id)
  handleDeleteClick(ofrenda.id)
}}

// Logs detallados en handleDeleteConfirm
console.log('🗑️ Intentando eliminar ofrenda:', ofrendaToDelete)
console.log('📥 Resultado de eliminación:', result)
```

#### B. Mensajes de Error Mejorados
```typescript
const handleDeleteConfirm = async () => {
  try {
    const result = await deleteComiteOfrenda(ofrendaToDelete)
    
    if (result.success) {
      alert('✅ Ofrenda eliminada exitosamente')
      window.location.reload()
    } else {
      console.error('❌ Error del servidor:', result.error)
      alert(`❌ Error: ${result.error}`)
    }
  } catch (error) {
    console.error('❌ Error crítico:', error)
    alert(`❌ Error crítico: ${error.message}`)
  }
}
```

#### C. Logs de Permisos en `page.tsx`
```typescript
const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

console.log('🔐 Permisos de usuario:')
console.log('  - isAdmin:', isAdmin)
console.log('  - rolEnComite:', rolEnComite)
console.log('  - canManage:', canManage)
```

## 🎯 Permisos Configurados

### Usuarios que PUEDEN eliminar ofrendas:
1. ✅ **Administradores** (`rol = 'admin'`)
2. ✅ **Líderes del comité** (`rol = 'lider'` en comite_usuarios)
3. ✅ **Tesoreros del comité** (`rol = 'tesorero'` en comite_usuarios)

### Usuarios que NO pueden eliminar:
- ❌ Miembros regulares del comité
- ❌ Usuarios no autenticados
- ❌ Usuarios no asociados al comité

## 🧪 Verificación

### Consulta para verificar políticas:
```sql
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'comite_ofrendas'
ORDER BY cmd, policyname;
```

### Resultado esperado:
```
✅ leaders_treasurers_update_ofrendas (UPDATE)
✅ leaders_treasurers_delete_ofrendas (DELETE)
✅ treasurers_create_ofrendas (INSERT)
✅ users_view_own_comite_ofrendas (SELECT)
```

## 📋 Pasos para Probar

1. **Inicia sesión** como líder o tesorero de un comité
2. **Navega** a la página de ofrendas del comité
3. **Abre la consola** del navegador (F12)
4. **Verifica los logs**:
   - Debe mostrar `canManage: true`
   - Debe mostrar tu rol correcto
5. **Haz click en eliminar** (🗑️) en una ofrenda
6. **Confirma** en el modal
7. **Verifica** que se elimine correctamente

## 📊 Estado de Políticas RLS

### Antes del Fix:
```
comite_ofrendas:
  ✅ SELECT (2 políticas)
  ✅ INSERT (1 política)
  ❌ UPDATE (0 políticas) <- PROBLEMA
  ❌ DELETE (0 políticas) <- PROBLEMA
```

### Después del Fix:
```
comite_ofrendas:
  ✅ SELECT (2 políticas)
  ✅ INSERT (1 política)
  ✅ UPDATE (1 política) <- SOLUCIONADO
  ✅ DELETE (1 política) <- SOLUCIONADO
```

## 🔒 Seguridad

Las políticas RLS garantizan que:
- Solo usuarios autorizados pueden modificar ofrendas
- Los cambios se validan a nivel de base de datos
- No se puede burcar la seguridad desde el frontend
- Cada operación verifica el rol del usuario

## 📝 Archivos Modificados

1. ✅ `/supabase/migrations/20260104_add_update_delete_ofrendas_policies.sql` - Nueva migración
2. ✅ `/src/components/comites/OfrendasList.tsx` - Logs mejorados
3. ✅ `/src/app/dashboard/comites/[id]/ofrendas/page.tsx` - Logs de permisos

## 🎉 Resultado Final

Ahora el sistema de ofrendas tiene **CRUD completo funcional**:
- ✅ **Create**: Registrar nuevas ofrendas
- ✅ **Read**: Ver listado y detalles
- ✅ **Update**: Editar ofrendas existentes
- ✅ **Delete**: Eliminar ofrendas (CON CONFIRMACIÓN)

Todos protegidos con políticas RLS adecuadas.
