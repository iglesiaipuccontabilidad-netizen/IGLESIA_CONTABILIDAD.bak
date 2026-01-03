# 📊 SISTEMA MEJORADO DE GENERACIÓN DE REPORTES PDF - OFRENDAS

## 🎯 Resumen de Cambios

Se ha implementado un **sistema profesional de generación de reportes en PDF** para el módulo de ofrendas con las siguientes mejoras:

✅ Reportes PDF con diseño profesional
✅ Exportación a Excel (XLSX)
✅ Fallback a CSV si es necesario
✅ Seguridad: Validación en servidor
✅ UX mejorada: Menú desplegable con opciones
✅ Totalmente responsivo

---

## 📁 Archivos Creados/Modificados

### Archivos Nuevos:

#### 1. **`src/lib/pdf/reporteOfrendas.ts`**
Librería para generar PDFs profesionales con jsPDF.

**Funciones principales:**
- `generarReportePDF()` - Genera documento PDF completo
- `descargarPDF()` - Descarga el PDF al navegador
- `calcularEstadisticas()` - Calcula métricas de ofrendas
- `calcularDistribucion()` - Distribuye por tipo de ofrenda

**Características del PDF:**
- Encabezado profesional con nombre del comité
- Estadísticas generales (total, monto, promedio, máx, mín)
- Tabla de distribución por tipo
- Detalle completo de todas las ofrendas
- Paginación automática
- Pie de página con numeración

---

#### 2. **`src/app/api/reportes/ofrendas/route.ts`**
API endpoint POST para generar reportes de forma segura.

**Validaciones:**
- ✅ Requiere autenticación
- ✅ Valida permisos del usuario en el comité
- ✅ Verifica acceso (admin, tesorero o miembro activo)
- ✅ Retorna PDF descargable o JSON con datos

**Endpoint:**
```
POST /api/reportes/ofrendas
Body: {
  comiteId: string,
  formato: 'pdf' | 'excel' | 'json'
}
```

---

#### 3. **`src/hooks/useReporteOfrendas.ts`**
Hook personalizado para manejar descargas de reportes.

**Funciones:**
- `generarPDF()` - Descarga PDF del servidor
- `generarExcel()` - Genera Excel con datos
- `generarCSV()` - Genera CSV como fallback

**Estados:**
- `loading` - Indica si está generando
- `error` - Maneja errores

---

### Archivos Modificados:

#### 1. **`src/components/comites/OfrendasActions.tsx`**
Componente mejorado con interfaz moderna.

**Cambios:**
- ✅ Menú desplegable con opciones (PDF, Excel)
- ✅ Indicador de carga durante generación
- ✅ Soporte para diferentes formatos
- ✅ Toast notifications para feedback
- ✅ Contador de registros disponibles
- ✅ Completamente accesible y responsivo

**Interfaz:**
```tsx
interface OfrendasActionsProps {
  ofrendas: any[]
  comiteNombre: string
  comiteId: string  // ← NUEVO
}
```

---

#### 2. **`src/app/dashboard/comites/[id]/ofrendas/page.tsx`**
Actualización menor para pasar `comiteId` al componente.

**Cambio:**
```tsx
// Antes
<OfrendasActions
  ofrendas={ofrendasConProyecto}
  comiteNombre={comite.nombre}
/>

// Ahora
<OfrendasActions
  ofrendas={ofrendasConProyecto}
  comiteNombre={comite.nombre}
  comiteId={id}  // ← NUEVO
/>
```

---

## 🚀 Uso

### Para el Usuario Final:

1. **Acceder a la página de ofrendas:**
   ```
   http://localhost:3000/dashboard/comites/[ID]/ofrendas
   ```

2. **Hacer clic en "Generar Reporte"** - Se abre un menú con opciones:
   - 📄 **Descargar PDF** - Reporte profesional formateado
   - 📊 **Descargar Excel** - Datos tabulares para análisis

3. **Esperar descarga** - El archivo se descarga automáticamente

### Para Desarrolladores:

**Usar el hook en componentes:**
```tsx
import { useReporteOfrendas } from '@/hooks/useReporteOfrendas'

export function MiComponente({ comiteId, comiteNombre }: Props) {
  const { generarPDF, generarExcel, loading, error } = useReporteOfrendas({
    comiteId,
    comiteNombre,
  })

  return (
    <>
      <button onClick={generarPDF} disabled={loading}>
        Generar PDF
      </button>
      <button onClick={generarExcel} disabled={loading}>
        Generar Excel
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </>
  )
}
```

**Generar PDF desde backend:**
```tsx
import { generarReportePDF, descargarPDF } from '@/lib/pdf/reporteOfrendas'

const doc = generarReportePDF(ofrendas, nombreComite)
descargarPDF(doc, 'reporte.pdf')
```

---

## 🔐 Seguridad Implementada

### Frontend:
- ✅ Hook personalizado con manejo de errores
- ✅ Toast notifications para feedback del usuario
- ✅ Loading states para evitar múltiples clics

### Backend (API Route):
- ✅ Autenticación requerida (JWT)
- ✅ Validación de usuario autenticado
- ✅ Verificación de permisos en el comité
- ✅ Roles permitidos: admin, tesorero, miembro activo
- ✅ Error handling robusto
- ✅ Validación de entrada (comiteId requerido)

---

## 📊 Contenido del Reporte PDF

El PDF generado incluye:

### 1. **Encabezado**
- Título: "REPORTE DE OFRENDAS"
- Nombre del Comité
- Fecha de generación

### 2. **Estadísticas Generales**
| Métrica | Valor |
|---------|-------|
| Total de Ofrendas | N registros |
| Monto Total | $X,XXX.XX |
| Promedio por Ofrenda | $X,XXX.XX |
| Máximo | $X,XXX.XX |
| Mínimo | $X,XXX.XX |

### 3. **Distribución por Tipo**
| Tipo | Cantidad | Monto | Porcentaje |
|------|----------|-------|-----------|
| Diezmo | N | $X,XXX | XX% |
| Ofrenda | N | $X,XXX | XX% |
| ... | ... | ... | ... |

### 4. **Detalle de Ofrendas**
| Fecha | Tipo | Monto | Concepto | Proyecto |
|-------|------|-------|----------|----------|
| DD/MM/YYYY | Tipo | $X,XXX | Concepto | Proyecto |
| ... | ... | ... | ... | ... |

### 5. **Pie de Página**
- Numeración de página (Ej: "Página 1 de 3")

---

## 🎨 Estilos y Diseño

### Colores Utilizados:
- **Primario:** Azul (#2980b9)
- **Secundario:** Azul claro (#3498db)
- **Texto:** Gris (#646464)
- **Fondo alterno:** Gris claro (#f5f5f5)

### Tipografía:
- **Encabezados:** Helvetica Bold, 20pt
- **Subtítulos:** Helvetica Bold, 14pt
- **Texto normal:** Helvetica, 10pt

---

## 🛠️ Troubleshooting

### Problema: "Error al generar PDF"

**Solución 1:** Verificar autenticación
```tsx
// Asegúrate que el usuario esté autenticado
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

**Solución 2:** Verificar permisos
```tsx
// Validar que el usuario tenga acceso al comité
const { data: comiteUsuario } = await supabase
  .from('comite_usuarios')
  .select('*')
  .eq('comite_id', comiteId)
  .eq('usuario_id', user.id)
```

### Problema: "xlsx no definido"

**Solución:** El sistema usa fallback a CSV automáticamente si xlsx no está disponible. No requiere intervención.

### Problema: "El PDF se ve pequeño/distorsionado"

**Solución:** Verificar zoom del navegador. Los PDFs están optimizados para 100% de zoom.

---

## 📦 Dependencias Requeridas

```json
{
  "jspdf": "^3.0.3",
  "jspdf-autotable": "^5.0.2",
  "xlsx": "^0.18.5",  // Para Excel (opcional)
  "react-hot-toast": "^2.6.0",  // Para notificaciones
}
```

Todas las dependencias ya están instaladas en `package.json`.

---

## 🔄 Flujo de Ejecución

```
Usuario hace clic en "Generar Reporte"
        ↓
Abre menú con opciones (PDF, Excel)
        ↓
Usuario selecciona formato (PDF/Excel)
        ↓
Hook `useReporteOfrendas` ejecuta `generarPDF()` o `generarExcel()`
        ↓
Hace POST a `/api/reportes/ofrendas`
        ↓
API valida autenticación y permisos
        ↓
Genera documento (PDF o Excel)
        ↓
Retorna descargable
        ↓
Navegador descarga automáticamente
        ↓
Toast de éxito
```

---

## ✅ Validación de Seguridad

- [x] Requiere autenticación
- [x] Valida permisos por comité
- [x] Manejo de errores robusto
- [x] Validación de entrada
- [x] Logs de error en consola
- [x] Respuestas HTTP apropiadas

---

## 🎯 Próximas Mejoras Sugeridas

1. **Firmas digitales:** Agregar firma de quien genera el reporte
2. **Gráficos:** Incluir gráficos de distribución en el PDF
3. **Filtros:** Permitir filtrar por rango de fechas
4. **Email:** Enviar reporte por email
5. **Historial:** Guardar reportes generados en BD
6. **Estilos personalizados:** Permitir personalizar colores y logo

---

## 📞 Soporte

Si encuentras problemas:

1. Verifica que `jspdf` y `jspdf-autotable` estén instalados
2. Revisa la consola del navegador (F12) para errores
3. Revisa los logs del servidor (`npm run dev`)
4. Verifica que el usuario esté autenticado
5. Valida los permisos en la tabla `comite_usuarios`

---

## 🎉 Conclusión

El sistema está 100% funcional y listo para usar. Puedes:
- ✅ Generar reportes PDF profesionales
- ✅ Exportar a Excel
- ✅ Acceder desde cualquier dispositivo
- ✅ Descargar automáticamente
- ✅ Todo con máxima seguridad

¡Disfruta tu nuevo sistema de reportes! 🚀
