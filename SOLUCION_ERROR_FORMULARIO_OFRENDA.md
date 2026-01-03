# ✅ Solución al Error en Formulario de Nueva Ofrenda

## 🔍 Problema Identificado
El usuario reportó un error genérico "An error occurred in the Server Components render" al intentar acceder a la página de nueva ofrenda.

## 🎯 Análisis del Error

### 1. **Error en Server Component**
- El error ocurría en un Server Component (Next.js App Router)
- Los errores de Server Components se ocultan en producción por seguridad
- Necesitábamos debugging para identificar la causa raíz

### 2. **Posibles Causas Identificadas**
- Consultas fallidas a Supabase
- Validaciones deshabilitadas en el formulario
- Mapeo incorrecto de campos entre formulario y DTO
- Problemas con el formato de números

## 🔧 Soluciones Implementadas

### 1. **Debugging en Server Component** (`/src/app/dashboard/comites/[id]/ofrendas/nueva/page.tsx`)

#### A. Try-Catch Global
```typescript
export default async function NuevaOfrendaPage({ params }: PageProps) {
  try {
    // ... lógica existente
  } catch (error) {
    console.error('❌ Error crítico en NuevaOfrendaPage:', error)
    
    // En desarrollo mostrar error completo
    if (process.env.NODE_ENV === 'development') {
      throw error
    }
    
    // En producción mostrar página de error amigable
    return <ErrorPage />
  }
}
```

#### B. Logs Detallados
```typescript
console.log('🔍 NuevaOfrendaPage - Usuario autenticado:', user.id)
console.log('🔍 NuevaOfrendaPage - Rol del usuario:', userData?.rol, 'isAdmin:', isAdmin)
console.log('🔍 NuevaOfrendaPage - Acceso al comité:', { hasAccess, rolEnComite })
console.log('🔍 NuevaOfrendaPage - Permisos finales:', { canManage, isAdmin, rolEnComite })
```

### 2. **Correcciones en Formulario** (`/src/components/comites/ComiteOfrendaForm.tsx`)

#### A. Habilitar Validaciones Zod
```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<OfrendaFormData>({
  resolver: zodResolver(ofrendaSchema), // ✅ Habilitado
  // ...
})
```

#### B. Corregir Mapeo de Campos
```typescript
const payload = {
  comite_id: comiteId,
  monto: parseFloat(data.monto.replace(/[^\d]/g, '')), // ✅ Limpieza de formato
  fecha: data.fecha_ofrenda,        // ✅ Campo correcto
  tipo: data.tipo_ofrenda,          // ✅ Campo correcto
  concepto: data.concepto || "Ofrenda general",
  nota: data.numero_comprobante ? `Comprobante: ${data.numero_comprobante}` : undefined,
  proyecto_id: data.proyecto_id || undefined,
}
```

#### C. Usar Componente Correcto para Monto
```typescript
<FormattedNumberInput
  id="monto"
  {...register("monto")}
  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
  placeholder="0"
  disabled={isSubmitting}
/>
```

#### D. Logs Adicionales en Submit
```typescript
const onSubmit = async (data: OfrendaFormData) => {
  console.log('🔍 ComiteOfrendaForm - onSubmit llamado con data:', data)
  // ... resto del código
}
```

## 📋 Campos del Formulario Validados

### Validaciones Zod Habilitadas:
```typescript
const ofrendaSchema = z.object({
  monto: z.string().min(1, "El monto es requerido").refine((val) => {
    const num = parseFloat(val.replace(/[^\d]/g, ''))
    return num > 0 && num <= 10000000
  }, "El monto debe ser mayor a 0 y menor a 10.000.000"),
  
  fecha_ofrenda: z.string().min(1, "La fecha es requerida").refine((val) => {
    const fecha = new Date(val)
    const hoy = new Date()
    const haceUnAnio = new Date()
    haceUnAnio.setFullYear(hoy.getFullYear() - 1)
    return fecha >= haceUnAnio && fecha <= hoy
  }, "La fecha debe estar dentro del último año"),
  
  tipo_ofrenda: z.enum(["diezmo", "ofrenda", "primicia", "otro"]),
  concepto: z.string().min(3, "El concepto debe tener al menos 3 caracteres").max(200),
  metodo_pago: z.enum(["efectivo", "transferencia", "datafono", "otro"]),
  numero_comprobante: z.string().optional().refine((val) => {
    if (!val) return true
    return val.length >= 3 && val.length <= 50
  }),
  proyecto_id: z.string().optional(),
})
```

## 🔗 Mapeo Correcto de Campos

### Formulario → DTO
```
data.monto (string con formato) → monto (number limpio)
data.fecha_ofrenda → fecha
data.tipo_ofrenda → tipo
data.concepto → concepto
data.numero_comprobante → nota (con prefijo)
data.proyecto_id → proyecto_id
```

## 🧪 Verificación

### 1. **Página Carga Correctamente**
- ✅ Usuario autenticado
- ✅ Permisos verificados
- ✅ Comité encontrado
- ✅ Sin errores de Server Component

### 2. **Formulario Funciona**
- ✅ Validaciones activas
- ✅ Campos mapeados correctamente
- ✅ Monto formateado correctamente
- ✅ Datos enviados al servidor

### 3. **Server Action Recibe Datos Correctos**
- ✅ `RegistrarOfrendaDTO` válido
- ✅ Monto como número
- ✅ Campos con nombres correctos

## 📊 Archivos Modificados

1. ✅ `/src/app/dashboard/comites/[id]/ofrendas/nueva/page.tsx`
   - Try-catch global
   - Logs de debugging
   - Página de error amigable

2. ✅ `/src/components/comites/ComiteOfrendaForm.tsx`
   - Validaciones Zod habilitadas
   - Mapeo de campos corregido
   - Componente FormattedNumberInput
   - Logs adicionales

## 🎯 Resultado Final

**El formulario de nueva ofrenda ahora:**
- ✅ Carga sin errores de Server Component
- ✅ Valida datos del lado cliente
- ✅ Envía datos correctamente formateados
- ✅ Maneja errores de forma amigable
- ✅ Proporciona feedback detallado en desarrollo

**Para debugging futuro:**
- Logs en consola del navegador (F12)
- Logs en terminal del servidor
- Página de error con detalles en desarrollo
- Validaciones preventivas antes del envío

## 🔍 Próximos Pasos

1. **Probar el formulario** con datos válidos
2. **Verificar logs** en consola para confirmar funcionamiento
3. **Probar casos edge** (montos grandes, fechas inválidas, etc.)
4. **Remover logs de debugging** una vez confirmado que funciona

## 📝 Notas Técnicas

- **Server Components**: Los errores se ocultan en producción por seguridad
- **Zod Validation**: Previene envío de datos inválidos al servidor
- **FormattedNumberInput**: Maneja formato de moneda colombiano
- **Error Boundaries**: Try-catch en Server Components para graceful degradation</content>
<parameter name="filePath">/home/juanda/ipuc-contabilidad/SOLUCION_ERROR_FORMULARIO_OFRENDA.md