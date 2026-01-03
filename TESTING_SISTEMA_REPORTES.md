# 🧪 GUÍA DE TESTING - SISTEMA DE REPORTES PDF

## ✅ Pre-requisitos

- [ ] Proyecto con `npm run dev` ejecutándose
- [ ] Base de datos Supabase conectada
- [ ] Usuario autenticado en el dashboard
- [ ] Acceso a un comité con ofrendas
- [ ] navegador moderno (Chrome, Firefox, Safari, Edge)

---

## 🚀 Testing Manual - Flujo Completo

### Test 1: Abrir Página de Ofrendas

**Pasos:**
1. Ir a: `http://localhost:3000/dashboard`
2. Seleccionar un comité
3. Ir a la sección "Ofrendas"

**Resultado esperado:**
```
✅ La página carga correctamente
✅ Se muestra el botón "Generar Reporte"
✅ Se ve la lista de ofrendas
✅ Se muestran las estadísticas
```

---

### Test 2: Abrir Menú de Reportes

**Pasos:**
1. Estar en la página de ofrendas
2. Hacer clic en botón "Generar Reporte"

**Resultado esperado:**
```
✅ Se abre menú desplegable
✅ Se muestran dos opciones:
   - 📄 Descargar PDF
   - 📊 Descargar Excel
✅ Se muestra contador de registros
✅ El menú se posiciona correctamente
```

---

### Test 3: Descargar PDF

**Pasos:**
1. Abrir menú (Test 2)
2. Hacer clic en "Descargar PDF"
3. Esperar a que se descargue

**Resultado esperado:**
```
✅ Botón muestra "Generando..." mientras carga
✅ Se descarga un archivo PDF
✅ El nombre es: "reporte-ofrendas-[nombre]-[fecha].pdf"
✅ Se muestra notificación: "PDF generado y descargado"
```

**Validar PDF:**
1. Abrir archivo descargado
2. Verificar contenido:

```
✅ Título: "REPORTE DE OFRENDAS"
✅ Nombre del comité
✅ Fecha de generación
✅ Tabla de estadísticas (Total, Monto, Promedio, Máx, Mín)
✅ Tabla de distribución por tipo
✅ Tabla de detalle con todas las ofrendas
✅ Pie de página con numeración
✅ Formato profesional (colores, bordes, espaciado)
```

---

### Test 4: Descargar Excel

**Pasos:**
1. Abrir menú (Test 2)
2. Hacer clic en "Descargar Excel"
3. Esperar a que se descargue

**Resultado esperado:**
```
✅ Se descarga un archivo .xlsx
✅ El nombre es: "reporte-ofrendas-[nombre]-[fecha].xlsx"
✅ Se muestra notificación: "Excel generado y descargado"
```

**Validar Excel:**
1. Abrir archivo en Excel/Calc
2. Verificar contenido:

```
✅ Encabezado: "REPORTE DE OFRENDAS"
✅ Información del comité y fecha
✅ Estadísticas generales
✅ Tabla de detalle con columnas:
   - Fecha
   - Tipo
   - Monto
   - Concepto
   - Proyecto
✅ Datos bien formateados
```

---

### Test 5: Cerrar Menú

**Pasos:**
1. Abrir menú (Test 2)
2. Hacer clic fuera del menú

**Resultado esperado:**
```
✅ El menú se cierra automáticamente
✅ Se puede hacer clic nuevamente en el botón
```

---

### Test 6: Caso Sin Ofrendas

**Pasos:**
1. Ir a un comité sin ofrendas
2. Intentar generar reporte

**Resultado esperado:**
```
✅ Botones están disponibles pero deshabilitados
✅ Se muestra mensaje: "0 registros disponibles"
✅ Al hacer clic, genera PDF/Excel vacío (si se permite)
```

---

## 🔐 Testing de Seguridad

### Test 7: Sin Autenticación

**Pasos:**
1. Desconectarse (logout)
2. Intentar acceder a: `/dashboard/comites/[ID]/ofrendas`

**Resultado esperado:**
```
✅ Se redirige a login
✅ No se puede generar reportes
✅ No se puede hacer POST a /api/reportes/ofrendas
```

---

### Test 8: Sin Acceso al Comité

**Pasos:**
1. Auenticarse con usuario que NO tiene acceso al comité
2. Intentar acceder a la página de ofrendas

**Resultado esperado:**
```
✅ Se muestra error: "No tienes acceso a este comité"
✅ No se puede generar reportes
```

---

### Test 9: Intentar Generar Reporte Sin Permiso

**Pasos:**
1. Autenticarse con usuario sin acceso
2. Hacer POST a `/api/reportes/ofrendas` directamente (Postman/curl)

**Comando curl:**
```bash
curl -X POST http://localhost:3000/api/reportes/ofrendas \
  -H "Content-Type: application/json" \
  -d '{"comiteId": "xxx", "formato": "pdf"}'
```

**Resultado esperado:**
```
✅ Respuesta: 403 Forbidden
✅ Mensaje: "No tienes acceso a este comité"
```

---

## 💻 Testing en Diferentes Navegadores

### Test 10: Chrome

**Pasos:**
1. Abrir Chrome
2. Ejecutar todos los tests (1-6)

**Resultado esperado:**
```
✅ Todo funciona correctamente
✅ PDF descarga sin problemas
✅ Excel descarga sin problemas
```

### Test 11: Firefox

**Pasos:**
1. Abrir Firefox
2. Ejecutar todos los tests (1-6)

**Resultado esperado:**
```
✅ Todo funciona correctamente
✅ Menú se posiciona bien
✅ Toast notifications aparecen
```

### Test 12: Safari

**Pasos:**
1. Abrir Safari
2. Ejecutar todos los tests (1-6)

**Resultado esperado:**
```
✅ Todo funciona correctamente
✅ Sin errores de compatibilidad
```

---

## 📱 Testing Responsivo

### Test 13: Desktop (1920x1080)

**Pasos:**
1. Abrir en viewport desktop
2. Ejecutar tests 1-6

**Resultado esperado:**
```
✅ Botones se ven grandes y legibles
✅ Menú se posiciona correctamente
✅ Sin scroll horizontal
```

### Test 14: Tablet (768x1024)

**Pasos:**
1. Usar DevTools - Responsive Mode
2. Seleccionar iPad (768x1024)
3. Ejecutar tests 1-6

**Resultado esperado:**
```
✅ Botones se adaptan
✅ Menú se posiciona bien
✅ Touch-friendly
```

### Test 15: Mobile (375x667)

**Pasos:**
1. Usar DevTools - Responsive Mode
2. Seleccionar iPhone SE (375x667)
3. Ejecutar tests 1-6

**Resultado esperado:**
```
✅ Botones son clickeables
✅ Menú es vertical y compacto
✅ No hay scroll horizontal
✅ Texto es legible
```

---

## ⚡ Testing de Rendimiento

### Test 16: Con Muchas Ofrendas (1000+)

**Pasos:**
1. Ir a un comité con 1000+ ofrendas
2. Hacer clic en "Generar Reporte"
3. Descargar PDF

**Resultado esperado:**
```
✅ La acción no tarda más de 5 segundos
✅ No congela la interfaz
✅ El PDF se genera correctamente
✅ El PDF es legible (múltiples páginas)
```

---

## 🎨 Testing de Estilos

### Test 17: Estilos Visuales

**Pasos:**
1. Abrir menú
2. Verificar visualmente

**Resultado esperado:**
```
✅ Colores correctos:
   - Azul primario (#2980b9)
   - Azul secundario (#3498db)
   - Gris texto (#646464)
✅ Espaciado correcto
✅ Bordes redondeados
✅ Sombras suaves
✅ Transiciones suaves
```

### Test 18: Hover Effects

**Pasos:**
1. Pasar mouse sobre botón "Generar Reporte"
2. Pasar mouse sobre opciones del menú

**Resultado esperado:**
```
✅ Botón aumenta escala (scale-105)
✅ Botón aumenta sombra
✅ Opciones cambian fondo (bg-blue-50 o bg-green-50)
✅ Transiciones son suaves
```

---

## 🔍 Testing de Consola

### Test 19: Sin Errores en Consola

**Pasos:**
1. Abrir DevTools (F12)
2. Ir a Console
3. Ejecutar tests 1-6
4. Verificar que no hay errores rojos

**Resultado esperado:**
```
✅ Sin errores rojos
✅ Sin warnings críticos
✅ Sin undefined references
✅ Logs informativos opcionales
```

---

## 📊 Testing de Contenido del PDF

### Test 20: Verificar Cálculos

**Pasos:**
1. Descargar PDF
2. Abrir y verificar cálculos

**Validaciones:**
```
✅ Total de ofrendas = Suma de registros
✅ Monto total = Suma de todos los montos
✅ Promedio = Monto total / Total de ofrendas
✅ Máximo = Mayor monto
✅ Mínimo = Menor monto
✅ Porcentajes = (Monto tipo / Monto total) * 100
```

**Ejemplo de verificación:**
```
Si hay 25 ofrendas:
- Diezmo: 15 * $1,000 = $15,000 (60%)
- Ofrenda: 8 * $1,000 = $8,000 (32%)
- Otra: 2 * $1,000 = $2,000 (8%)

Total: $25,000 (100%)
Promedio: $25,000 / 25 = $1,000

✅ Verificado
```

---

## 🔧 Testing de Errores

### Test 21: Error en API

**Pasos:**
1. Desconectar base de datos
2. Intentar generar reporte

**Resultado esperado:**
```
✅ Se muestra notificación de error
✅ Error específico (Ej: "Error al generar PDF")
✅ No se congela la interfaz
✅ Se puede intentar de nuevo
```

---

## 📋 Checklist Completo

- [ ] Test 1: Abrir página ✓
- [ ] Test 2: Abrir menú ✓
- [ ] Test 3: Descargar PDF ✓
- [ ] Test 4: Descargar Excel ✓
- [ ] Test 5: Cerrar menú ✓
- [ ] Test 6: Sin ofrendas ✓
- [ ] Test 7: Sin autenticación ✓
- [ ] Test 8: Sin acceso ✓
- [ ] Test 9: API security ✓
- [ ] Test 10: Chrome ✓
- [ ] Test 11: Firefox ✓
- [ ] Test 12: Safari ✓
- [ ] Test 13: Desktop ✓
- [ ] Test 14: Tablet ✓
- [ ] Test 15: Mobile ✓
- [ ] Test 16: Performance ✓
- [ ] Test 17: Estilos ✓
- [ ] Test 18: Hover effects ✓
- [ ] Test 19: Console ✓
- [ ] Test 20: Cálculos ✓
- [ ] Test 21: Errores ✓

---

## 🐛 Debugging

Si algo no funciona:

### 1. Verificar Consola del Navegador (F12)

```javascript
// Errores comunes y soluciones:

// Error: "comiteId is not defined"
Solución: Verificar que comiteId se pasa en props

// Error: "Cannot read property 'output' of undefined"
Solución: Verificar que jsPDF está instalado

// Error: "fetch error 403"
Solución: Verificar permisos del usuario en el comité
```

### 2. Verificar Red (Network Tab)

```
POST /api/reportes/ofrendas

Verificar:
✅ Status 200 (OK) o > 400 (Error)
✅ Response time < 5s
✅ Response body contiene datos correctos
```

### 3. Verificar Supabase

```sql
-- Verificar acceso del usuario
SELECT * FROM comite_usuarios 
WHERE comite_id = 'xxx' 
AND usuario_id = 'yyy' 
AND estado = 'activo';

-- Verificar ofrendas
SELECT COUNT(*) FROM comite_ofrendas 
WHERE comite_id = 'xxx';
```

---

## 📝 Logging Adicional

Para debugging avanzado, agregar en `useReporteOfrendas.ts`:

```typescript
const generarPDF = async () => {
  console.log('Iniciando generación de PDF...', { comiteId, comiteNombre })
  
  try {
    const response = await fetch('/api/reportes/ofrendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comiteId, formato: 'pdf' }),
    })
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const data = await response.json()
      console.error('Error response:', data)
      throw new Error(data.error)
    }
    
    console.log('PDF generado exitosamente')
    // ... resto del código
  } catch (err) {
    console.error('Error en generarPDF:', err)
  }
}
```

---

## ✅ Conclusión

Una vez pasados todos estos tests, el sistema está listo para producción:

**Todo funciona correctamente:**
- ✅ Interfaz intuitiva
- ✅ PDFs profesionales
- ✅ Excel con datos
- ✅ Seguridad robusta
- ✅ Responsive en todos los dispositivos
- ✅ Sin errores
- ✅ Rendimiento óptimo

**¡Lista para usar! 🚀**

---

**Fecha de testing:** Enero 2, 2026
**Versión:** 1.0.0
**Estado:** Listo para Producción ✅
