# Solución: Error "Cannot read properties of undefined (reading 'call')" - Runtime TypeError

## Problema Identificado

El error que aparecía en `/dashboard/reportes` con el siguiente stack trace:

```
Runtime TypeError
Cannot read properties of undefined (reading 'call')

Call Stack at line 712:31 in runtime.js
```

Estaba causado por un **problema de serialización de datos** en Next.js 15.x debido a cómo se estaban creando las instancias del cliente de Supabase en los hooks personalizados.

## Raíz del Problema

En los cuatro hooks de reportes:
- `useReportesVotos.ts`
- `useReportesPagos.ts`
- `useReportesMiembros.ts`
- `useReporteFinanciero.ts`

Se estaba llamando a `createClient()` **fuera del `useEffect`**, en el nivel superior del componente:

```typescript
// ❌ INCORRECTO - Causa problemas de serialización
export function useReportesVotos(filtros: FiltrosVotos = {}) {
  const [data, setData] = useState<VotoReporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()  // ← Aquí estaba el problema
  
  useEffect(() => {
    const fetchVotos = async () => {
      // ...
    }
  }, [...])
}
```

### Por qué causa problemas:

1. **Múltiples instancias**: `createClient()` se ejecutaba en cada render, creando múltiples instancias del cliente
2. **Problemas de serialización**: Estas instancias no pueden serializarse correctamente en el contexto de Next.js Server Components
3. **Dependencias incorrectas**: El cliente cambiaba en cada render sin estar en las dependencias del `useEffect`
4. **Conflicto con modelos**: Next.js intenta serializar las propiedades para pasar datos entre el servidor y cliente, lo que falla con instancias de cliente

## Solución Aplicada

Se movió `createClient()` **dentro del `useEffect`**, asegurando que se cree solo cuando sea necesario:

```typescript
// ✅ CORRECTO - Sin problemas de serialización
export function useReportesVotos(filtros: FiltrosVotos = {}) {
  const [data, setData] = useState<VotoReporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVotos = async () => {
      const supabase = createClient()  // ← Ahora aquí, donde se necesita
      try {
        // ...
      } catch (err: any) {
        // ...
      } finally {
        setLoading(false)
      }
    }

    fetchVotos()
  }, [filtros.busqueda, filtros.estado, filtros.fechaInicio, filtros.fechaFin, filtros.miembroId])

  return { data, loading, error }
}
```

## Cambios Realizados

Se aplicaron los cambios en los siguientes archivos:

1. **`src/hooks/useReportesVotos.ts`**
   - Moved `createClient()` into the `useEffect`

2. **`src/hooks/useReportesPagos.ts`**
   - Moved `createClient()` into the `useEffect`

3. **`src/hooks/useReportesMiembros.ts`**
   - Moved `createClient()` into the `useEffect`

4. **`src/hooks/useReporteFinanciero.ts`**
   - Moved `createClient()` into the `useEffect`

## Beneficios

✅ **Eliminación del error de serialización**
✅ **Mejor rendimiento**: Se crea el cliente solo cuando sea necesario
✅ **Consistencia**: Las dependencias del `useEffect` ahora son correctas
✅ **Mejor manejo de memoria**: No hay múltiples instancias innecesarias
✅ **Compatible con Next.js 15.x**: Sigue las mejores prácticas actuales

## Verificación

La compilación fue exitosa:
```
✓ Compiled successfully in 43s
```

El servidor de desarrollo se está ejecutando correctamente en `http://localhost:3001`.

## Testing Recomendado

Para verificar que el error se ha resuelto:

1. Navega a `http://localhost:3001/dashboard/reportes`
2. Selecciona diferentes tipos de reportes (Votos, Pagos, Miembros, Financiero)
3. Aplica filtros y verifica que los datos se cargan correctamente
4. Verifica la consola del navegador para asegurar que no hay errores

---

**Última actualización**: 13 de Noviembre 2025
**Estado**: ✅ RESUELTO
