# 🧭 PLAN DE IMPLEMENTACIÓN — MÓDULO DE PROPÓSITOS
## Proyecto: IPUC Contabilidad

---

## 1. Objetivo General
Incorporar el módulo **Propósitos** dentro de la aplicación IPUC Contabilidad para organizar y gestionar campañas o fines financieros específicos. Este módulo permitirá que los **votos** se asocien opcionalmente a un **propósito existente** o que se cree uno nuevo directamente durante el registro del voto.

---

## 2. Alcance
- Añadir nueva tabla `propositos` en la base de datos Supabase.
- Modificar la tabla `votos` para relacionarla opcionalmente con `propositos`.
- Crear interfaz de gestión de propósitos (listar, crear, editar, ver detalle).
- Integrar selector de propósito en el formulario de creación de votos.
- Actualizar dashboard principal para mostrar estadísticas y propósitos recientes.
- Automatizar la actualización de montos recaudados por propósito.

---

## 3. Arquitectura de Datos

### Nueva tabla: `propositos`
```sql
CREATE TABLE public.propositos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  monto_objetivo numeric CHECK (monto_objetivo > 0),
  monto_recaudado numeric NOT NULL DEFAULT 0,
  fecha_inicio date DEFAULT now(),
  fecha_fin date,
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'completado', 'cancelado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  creado_por uuid REFERENCES auth.users(id),
  ultima_actualizacion_por uuid REFERENCES auth.users(id)
);
```

### Modificación de tabla `votos`
```sql
ALTER TABLE public.votos
ADD COLUMN proposito_id uuid REFERENCES public.propositos(id);
```

### Trigger de actualización automática
```sql
CREATE OR REPLACE FUNCTION actualizar_monto_proposito()
RETURNS trigger AS $$
BEGIN
  UPDATE public.propositos p
  SET monto_recaudado = (
    SELECT COALESCE(SUM(v.recaudado), 0)
    FROM public.votos v
    WHERE v.proposito_id = p.id
  ),
  updated_at = now()
  WHERE p.id = (
    SELECT proposito_id FROM public.votos WHERE id = NEW.voto_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_monto_proposito
AFTER INSERT OR UPDATE OR DELETE ON public.pagos
FOR EACH ROW EXECUTE FUNCTION actualizar_monto_proposito();
```

---

## 4. Fases de Implementación

### 🧩 FASE 1 — Modelado y configuración de base de datos
**Objetivo:** Crear la tabla `propositos`, actualizar `votos` y definir relaciones.

**Tareas:**
- Ejecutar script SQL para crear tabla `propositos`.
- Agregar campo `proposito_id` en `votos` (nullable).
- Crear índices y constraints.
- Registrar función y trigger `actualizar_monto_proposito()`.

**Entregables:**
- Estructura de base de datos actualizada.
- Relaciones probadas en Supabase Studio.

---

### 🎨 FASE 2 — Interfaz de usuario (UI/UX)
**Objetivo:** Diseñar e implementar las pantallas para gestionar propósitos.

**Tareas:**
- Agregar nueva ruta: `/dashboard/propositos`.
- Crear componentes:
  - `PropositosList` (tabla con filtros y estados).
  - `PropositoForm` (para crear y editar).
  - `PropositoDetail` (detalle con estadísticas y votos asociados).
- Estilo visual coherente con el dashboard (Tailwind + diseño IPUC).

**Entregables:**
- Navegación completa dentro del sidebar.
- CRUD de propósitos operativo.

---

### 🔗 FASE 3 — Integración con el módulo de votos
**Objetivo:** Permitir vincular un propósito al crear un voto.

**Tareas:**
- Actualizar formulario `/dashboard/votos/nuevo`.
- Agregar campo **“Propósito”** con selector dinámico (autocomplete o dropdown).
- Incluir opción **“+ Crear nuevo propósito”** dentro del mismo formulario.
- Validar que si no hay propósito seleccionado, el voto se crea sin `proposito_id`.
- Actualizar lógica de creación (`insert` en Supabase).

**Entregables:**
- Formulario de voto funcional con selección/creación de propósito.
- Flujo probado de voto con y sin propósito asociado.

---

### 📊 FASE 4 — Actualización del Dashboard
**Objetivo:** Reorganizar el dashboard para mostrar los propósitos recientes y métricas globales.

**Tareas:**
- Eliminar tabla de “Votos Activos” en el dashboard principal.
- Añadir sección “Propósitos recientes” con barra de progreso.
- Mostrar estadísticas globales (totales comprometidos, recaudado, pendiente, progreso general).
- Integrar datos desde Supabase mediante consultas agregadas.

**Entregables:**
- Dashboard actualizado con métricas y propósitos.
- Datos sincronizados en tiempo real.

---

### 🧮 FASE 5 — Lógica de actualización y consistencia
**Objetivo:** Asegurar que el monto recaudado por propósito se actualice automáticamente.

**Tareas:**
- Configurar triggers y policies para recalcular montos.
- Validar consistencia tras inserciones o eliminaciones de pagos.
- Implementar sincronización visual (React hooks con `useEffect` y Supabase subscriptions).

**Entregables:**
- Cálculo automático de montos en propósitos.
- Datos consistentes entre módulos `pagos`, `votos` y `propositos`.

---

## 5. Componentes Afectados

| Módulo | Componentes o archivos | Acción |
|--------|------------------------|--------|
| Dashboard | `DashboardPage.tsx`, `DashboardCards.tsx` | Actualizar UI, reemplazar “Votos Activos” |
| Votos | `VotoForm.tsx` | Agregar selector/creador de propósito |
| Propositos | `PropositosList.tsx`, `PropositoDetail.tsx`, `PropositoForm.tsx` | Nuevos componentes |
| Supabase | `schema.sql`, `client.ts` | Actualización de estructura y funciones |
| Hooks | `usePropositos.ts`, `useVotos.ts` | Creación y actualización de lógica de datos |

---

## 6. Entregables Finales

- Nueva tabla `propositos` operativa.
- CRUD de propósitos completamente integrado.
- Asociación opcional de votos a propósitos.
- Dashboard con métricas globales y por propósito.
- Lógica automática de actualización de montos.
- Documentación técnica y funcional del nuevo módulo.

---

## 7. Estándares Técnicos

- Framework: **Next.js 14 (App Router)**  
- Lenguaje: **TypeScript**
- Estilos: **Tailwind CSS**
- Base de Datos: **Supabase (PostgreSQL)**
- Gestión de estado: **React Context API**
- Formateo: **Prettier / ESLint**
- Control de versión: **GitHub (branch: `feature/propositos`)**

---

## 8. Cronograma Estimado

| Fase | Duración | Entregable principal |
|------|-----------|----------------------|
| 1 | 1 semana | Estructura SQL y relaciones |
| 2 | 2 semanas | CRUD completo de propósitos |
| 3 | 1 semana | Integración en creación de votos |
| 4 | 1 semana | Dashboard actualizado |
| 5 | 1 semana | Lógica automática y consistencia |

---

## 9. Consideraciones Finales
- Todos los cambios deben realizarse sin alterar las claves primarias de `votos` o `miembros`.
- El campo `proposito_id` será **opcional** (`NULL` permitido) para mantener compatibilidad retroactiva.
- Los reportes y cálculos futuros se basarán en esta nueva estructura.
