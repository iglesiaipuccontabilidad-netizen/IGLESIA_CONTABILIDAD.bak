# 🧭 PLAN DE IMPLEMENTACIÓN — MÓDULO DE REPORTES
## Proyecto: IPUC Contabilidad

---

## 1. Objetivo General

Implementar un módulo integral de **reportes contables y administrativos** que permita al administrador o tesorero generar, visualizar y exportar información consolidada de **miembros, votos, pagos y propósitos**, en formatos **PDF** y **Excel**, directamente desde la aplicación.

---

## 2. Alcance

- Crear nueva sección “Reportes” en el **sidebar del dashboard**.  
- Permitir **filtrar, consultar y exportar** información desde la base de datos Supabase.  
- Generar **reportes en PDF o Excel** (por tipo de reporte).  
- Ofrecer estadísticas generales y comparativas por **propósito**, **miembro** o **rango de fechas**.  
- Integración directa con los módulos existentes (`votos`, `miembros`, `pagos`, `propositos`).

---

## 3. Tipos de Reportes

| Tipo | Descripción | Filtros | Exportación |
|------|--------------|---------|--------------|
| **General de Votos** | Lista de votos con estado, monto total, recaudado, pendiente y miembro. | Estado, miembro, propósito, rango de fechas | PDF / Excel |
| **Reporte de Miembros** | Detalle por miembro con votos activos, completados y total comprometido. | Estado del miembro | PDF / Excel |
| **Financiero Consolidado** | Totales globales de compromisos, recaudado y pendiente. | Fecha inicial / final | PDF / Excel |
| **Historial de Pagos** | Pagos realizados por voto o miembro, ordenados cronológicamente. | Miembro, propósito, rango de fechas | PDF / Excel |

---

## 4. Arquitectura y Estructura de Datos

No se crean nuevas tablas.  
El módulo **consulta datos existentes** de:
- `miembros`
- `votos`
- `pagos`
- `propositos`

### Consultas base (ejemplos):

**Votos con miembro y propósito:**
```sql
SELECT v.id, v.proposito, v.monto_total, v.recaudado, v.estado,
       m.nombres || ' ' || m.apellidos AS miembro,
       p.nombre AS proposito
FROM public.votos v
LEFT JOIN public.miembros m ON m.id = v.miembro_id
LEFT JOIN public.propositos p ON p.id = v.proposito_id;
```

**Pagos con miembro y propósito:**
```sql
SELECT pa.id, pa.monto, pa.fecha_pago, pa.metodo_pago,
       v.proposito, p.nombre AS proposito_nombre,
       m.nombres || ' ' || m.apellidos AS miembro
FROM public.pagos pa
JOIN public.votos v ON v.id = pa.voto_id
JOIN public.miembros m ON m.id = v.miembro_id
LEFT JOIN public.propositos p ON p.id = v.proposito_id;
```

---

## 5. Fases de Implementación

### 🧩 FASE 1 — Configuración base del módulo
**Objetivo:** Crear la nueva ruta y estructura del módulo “Reportes”.

**Tareas:**
- Crear carpeta y ruta `/dashboard/reportes`.
- Añadir entrada “Reportes 📊” al sidebar.
- Estructurar componentes base:
  - `ReportesPage.tsx` → vista principal.
  - `ReportFilter.tsx` → barra de filtros.
  - `ReportTable.tsx` → tabla de resultados.
  - `ReportActions.tsx` → botones de exportación.
- Configurar estados y consultas a Supabase.

**Entregables:**
- Ruta y vista funcional de reportes.
- Sidebar actualizado.

---

### 📊 FASE 2 — Lógica de consultas y filtrado
**Objetivo:** Implementar consultas dinámicas desde Supabase con filtros interactivos.

**Tareas:**
- Crear hooks:
  - `useReportesVotos()`
  - `useReportesPagos()`
  - `useReportesMiembros()`
- Implementar búsqueda por nombre, propósito, estado y fechas.
- Mostrar resultados paginados en tablas.
- Validar que los datos se actualicen al cambiar filtros.

**Entregables:**
- Tablas con datos dinámicos filtrables.
- Integración completa con Supabase.

---

### 🧾 FASE 3 — Generación de PDF
**Objetivo:** Permitir descargar reportes en PDF con formato profesional.

**Tareas:**
- Instalar dependencias:
  ```bash
  npm install jspdf jspdf-autotable
  ```
- Crear utilidad `pdfGenerator.ts` con estructura base:
  ```ts
  import jsPDF from "jspdf";
  import "jspdf-autotable";

  export const generarPDF = (titulo, columnas, datos) => {
    const doc = new jsPDF();
    doc.text(titulo, 14, 20);
    doc.autoTable({ head: [columnas], body: datos, startY: 30 });
    doc.save(`${titulo}.pdf`);
  };
  ```
- Integrar botón **“Exportar PDF”** en cada tipo de reporte.

**Entregables:**
- Descarga de PDF funcional y con formato visual consistente.

---

### 📈 FASE 4 — Exportación a Excel
**Objetivo:** Permitir exportar los reportes a formato `.xlsx`.

**Tareas:**
- Instalar dependencias:
  ```bash
  npm install xlsx file-saver
  ```
- Crear utilidad `excelExporter.ts`:
  ```ts
  import * as XLSX from "xlsx";
  import { saveAs } from "file-saver";

  export const exportarExcel = (data, nombreArchivo) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `${nombreArchivo}.xlsx`);
  };
  ```
- Agregar botón **“Exportar Excel”** junto al de PDF.

**Entregables:**
- Exportación a Excel funcional para todos los tipos de reportes.

---

### 📊 FASE 5 — Reporte consolidado y métricas globales
**Objetivo:** Agregar un subpanel de métricas y resúmenes.

**Tareas:**
- Crear componentes:
  - `ResumenFinanciero.tsx`
  - `GraficoPropositos.tsx` (Recharts)
- Mostrar:
  - Total comprometido global.
  - Total recaudado.
  - Total pendiente.
  - Top 3 propósitos con mayor progreso.
- Integrar con consultas agregadas en Supabase.

**Entregables:**
- Panel visual de estadísticas financieras.
- Datos sincronizados con la base.

---

## 6. Componentes Principales

| Componente | Descripción |
|-------------|--------------|
| `ReportesPage.tsx` | Vista principal de reportes. |
| `ReportFilter.tsx` | Control de filtros (fechas, miembros, propósitos, estado). |
| `ReportTable.tsx` | Renderizado dinámico de resultados. |
| `ReportActions.tsx` | Botones para exportar PDF o Excel. |
| `pdfGenerator.ts` | Utilidad para generar PDF con jsPDF. |
| `excelExporter.ts` | Utilidad para exportar a Excel con SheetJS. |
| `ResumenFinanciero.tsx` | Resumen global con métricas y gráficos. |

---

## 7. Entregables Finales

- Nuevo módulo “Reportes” completamente integrado.  
- Consultas dinámicas y filtros interactivos.  
- Exportación funcional a **PDF y Excel**.  
- Panel visual de métricas globales.  
- Documentación técnica y funcional del módulo.

---

## 8. Estándares Técnicos

| Categoría | Herramienta / Librería |
|------------|------------------------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Base de Datos | Supabase (PostgreSQL) |
| PDF | jsPDF + jsPDF-AutoTable |
| Excel | xlsx + file-saver |
| Gráficos | Recharts |
| Estado | React Context API |
| Control de versión | GitHub (branch: `feature/reportes`) |

---

## 9. Cronograma Estimado

| Fase | Duración | Entregable |
|------|-----------|------------|
| 1 | 1 semana | Estructura base y rutas |
| 2 | 1 semana | Consultas y filtros |
| 3 | 1 semana | Exportación PDF |
| 4 | 1 semana | Exportación Excel |
| 5 | 1 semana | Métricas y gráficos |

---

## 10. Consideraciones Finales

- Los reportes deben respetar los permisos del rol (solo admin/tesorero).  
- Las consultas deben tener paginación para evitar sobrecarga en Supabase.  
- El formato de exportación debe incluir fecha y logotipo institucional.  
- El código debe mantenerse desacoplado para futuras integraciones (por ejemplo, envío de reportes por correo).  
