# Guía de Depuración - IPUC Contabilidad

## Problemas Principales

### 1. Error de React Server Manifest
```
Error: Could not find the module "0e24e3e02f9c0264a8f913b86bfadd1ff09a9add" in the React Server Manifest. This is probably a bug in the React Server Components bundler.
```

Este error indica un problema con el empaquetado de los React Server Components. Las causas comunes incluyen:
- Caché corrupta de Next.js
- Problemas de compatibilidad entre componentes servidor/cliente
- Importaciones circulares
- Archivos temporales no eliminados correctamente

### 2. Errores de Base de Datos y Manejo de Errores
- Error de columna `rol` no existente
- Problemas de permisos 403 en consultas a Supabase
- Manejo inadecuado de errores en componentes del dashboard

### 3. Errores de Tipo
- Problemas con tipos en las páginas de Next.js
- Incompatibilidades con el cliente Supabase y tipos Promise
- Problemas con el manejo de cookies asíncrono

## Proceso de Solución

### 1. Solución para el Error de React Server Manifest
1. Limpiar la caché de Next.js y archivos temporales:
   ```bash
   # Eliminar caché y archivos de construcción
   rm -rf .next
   rm -rf node_modules/.cache
   ```

2. Revisar la segregación correcta de componentes:
   - Asegurarse de que los componentes cliente tengan `'use client'`
   - Verificar que no haya importaciones circulares
   - Comprobar que las props pasadas a componentes cliente sean serializables

3. Solución implementada en el layout del dashboard:
   ```typescript
   // src/app/dashboard/layout.tsx
   const DashboardLayoutClient = dynamic(
     () => import('@/components/DashboardLayoutClient'),
     {
       loading: Loading,
       ssr: true
     }
   )
   ```

4. Reconstruir el proyecto:
   ```bash
   npm install
   npm run build
   ```

### 2. Solución para Errores de Base de Datos y Manejo de Errores
1. Error `column "rol" does not exist`:
   - Añadida verificación de sesión antes de las consultas
   - Mejorado el manejo de errores para evitar fallos en cascada

2. Implementación de manejo de errores robusto en el dashboard:
   ```typescript
   // src/app/dashboard/page.tsx
   async function getVotosActivos(): Promise<VotoRaw[]> {
     try {
       const supabase = await createClient()
       
       // Verificación de sesión
       const { data: { session } } = await supabase.auth.getSession()
       if (!session) {
         console.error('No hay sesión activa')
         return []
       }

       const { data, error } = await supabase
         .from('votos')
         .select(/* ... */)
         .eq('estado', 'activo')
         .returns<VotoRaw[]>()

       if (error) {
         console.error('Error detallado:', error)
         return []
       }

       return data || []
     } catch (error) {
       console.error('Error al obtener votos activos:', error)
       return []
     }
   }
   ```

3. Mejoras en el manejo de datos:
   - Valores por defecto para todos los casos de error
   - Tipado estricto de funciones y retornos
   - Manejo graceful de errores con mensajes amigables
   - Verificación de sesión antes de consultas

### 3. Manejo de Cookies y Estado de Sesión
Se actualizó el manejo de cookies en el cliente Supabase para trabajar con Promises:
```typescript
cookies: {
  async get(name: string) {
    const cookieJar = await cookies()
    return cookieJar.get(name)?.value
  },
  async set(name: string, value: string, options: any) {
    const cookieJar = await cookies()
    cookieJar.set(name, value, options)
  },
  async remove(name: string, options: any) {
    const cookieJar = await cookies()
    cookieJar.delete(name)
  }
}
```

## Archivos Afectados
1. `src/app/dashboard/layout.tsx`
2. `src/app/dashboard/page.tsx`
3. `src/components/DashboardLayoutClient.tsx`
4. `src/lib/supabase/server.ts`
5. `supabase/migrations/20251008_fix_usuarios_rls.sql`

## Problemas Pendientes
1. Advertencias de Edge Runtime:
   ```
   A Node.js API is used (process.versions) which is not supported in the Edge Runtime.
   ```
   Esto afecta a los módulos:
   - @supabase/realtime-js
   - @supabase/supabase-js
   
   Posibles soluciones:
   - Actualizar a las últimas versiones de los módulos de Supabase
   - Configurar las partes de la aplicación que usan Supabase para no usar Edge Runtime
   - Implementar un middleware personalizado para manejar la autenticación sin Edge Runtime

## Estado Actual
- [x] Corrección del error de React Server Manifest
- [x] Implementación de manejo de errores robusto
- [x] Mejora en la verificación de sesión
- [x] Tipado estricto de funciones
- [ ] Resolución de advertencias de Edge Runtime

## Siguientes Pasos
Abordar las advertencias del Edge Runtime relacionadas con Supabase:
1. Investigar la posibilidad de actualizar los módulos de Supabase
2. Evaluar el impacto de deshabilitar Edge Runtime en partes específicas
3. Considerar la implementación de un middleware personalizado

## Notas para Futuros Desarrolladores
1. El manejo de errores se ha mejorado significativamente, pero aún puede optimizarse más
2. La verificación de sesión es crucial antes de realizar operaciones en la base de datos
3. Los errores ahora se manejan de forma graceful con valores por defecto en lugar de fallar completamente
4. Se debe considerar implementar un sistema de reintentos para operaciones críticas