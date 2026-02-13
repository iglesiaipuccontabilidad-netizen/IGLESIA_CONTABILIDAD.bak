# Plan de Escalamiento: IPUC Contabilidad → SaaS Multi-Iglesia

> **Fecha:** 8 de febrero de 2026  
> **Estado actual:** Aplicación single-tenant para una iglesia IPUC  
> **Objetivo:** Convertir en plataforma SaaS que sirva a múltiples iglesias/organizaciones religiosas

---

## 1. Diagnóstico del Estado Actual

### 1.1 Stack Tecnológico
| Componente | Tecnología |
|---|---|
| Frontend | Next.js 16, React 18, TailwindCSS |
| Backend/API | Supabase (PostgreSQL + Auth + RLS) |
| Autenticación | Supabase Auth (email/password) |
| Despliegue | Vercel (inferido) |
| Reportes | jsPDF, xlsx |

### 1.2 Modelo de Base de Datos Actual (Single-Tenant)
**Tablas principales (esquema `public`):**

| Tabla | Filas | Descripción |
|---|---|---|
| `usuarios` | 9 | Usuarios del sistema con roles (admin, tesorero, usuario) |
| `miembros` | 31 | Miembros de la iglesia |
| `votos` | 30 | Compromisos de pago de miembros |
| `pagos` | 0 | Pagos sobre votos |
| `propositos` | 1 | Campañas financieras |
| `comites` | 2 | Comités (DECOM, Jóvenes, etc.) |
| `comite_usuarios` | 2 | Roles de usuarios en comités |
| `comite_miembros` | 1 | Personas de cada comité |
| `comite_proyectos` | 1 | Proyectos de recaudación |
| `comite_votos` | 0 | Votos de miembros del comité |
| `comite_pagos` | 0 | Pagos de votos del comité |
| `comite_ofrendas` | 0 | Ingresos del comité |
| `comite_gastos` | 5 | Egresos del comité |
| `proyecto_productos` | 1 | Productos para venta |
| `proyecto_ventas` | 43 | Ventas de productos |
| `proyecto_pagos_ventas` | 44 | Pagos de ventas |

**Migraciones:** 116 migraciones aplicadas (muchas de corrección/iteración).

### 1.3 Roles Actuales
- `admin` — acceso total
- `tesorero` — gestión financiera
- `usuario` — acceso limitado
- `pendiente` — sin acceso hasta aprobación

### 1.4 Problemas de Seguridad Detectados (Advisors Supabase)
| Severidad | Problema |
|---|---|
| **ERROR** | Vista `public.users` expone `auth.users` a roles `anon` |
| **ERROR** | Vistas con `SECURITY DEFINER` (`users`, `vista_resumen_ventas_proyecto`) |
| **ERROR** | Tablas backup sin RLS (`pagos_backup_20251106`, `votos_backup_20251106`) |
| **WARN** | 18+ funciones sin `search_path` inmutable |
| **WARN** | Política RLS siempre `true` en `miembros` (INSERT anon) y `votos` (INSERT authenticated) |
| **WARN** | Protección de contraseñas filtradas deshabilitada |
| **WARN** | MFA insuficiente |

> **Estos problemas deben resolverse ANTES de escalar a SaaS.** Si hay una sola iglesia con estos issues es un riesgo; con múltiples tenants es una vulnerabilidad crítica.

---

## 2. Arquitectura Multi-Tenant Propuesta

### 2.1 Estrategia de Aislamiento: Row-Level Security con `tenant_id`

La estrategia recomendada para Supabase es **aislamiento por filas usando RLS con una columna `tenant_id`** (también llamada `iglesia_id` u `organizacion_id`). Esto porque:

- Supabase ya tiene RLS habilitado en casi todas las tablas
- No requiere múltiples bases de datos ni esquemas
- Se escala bien para cientos/miles de tenants
- Menor costo operativo que schema-per-tenant

```
┌─────────────────────────────────────────┐
│           Supabase (1 proyecto)          │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Iglesia A│  │ Iglesia B│  │Iglesia C│ │
│  │tenant_id │  │tenant_id │  │tenant_id│ │
│  │= uuid-a  │  │= uuid-b  │  │= uuid-c│ │
│  └──────────┘  └──────────┘  └────────┘ │
│                                          │
│  RLS: tenant_id = get_user_tenant_id()   │
│                                          │
└─────────────────────────────────────────┘
```

### 2.2 Nueva Tabla Central: `organizaciones` (Tenants)

```
organizaciones
├── id (uuid, PK)
├── nombre (text) — "IPUC Barranquilla Norte"
├── slug (text, unique) — "ipuc-barranquilla-norte"
├── plan (text) — 'free', 'basico', 'profesional', 'enterprise'
├── logo_url (text, nullable)
├── configuracion (jsonb) — moneda, zona horaria, etc.
├── max_usuarios (int)
├── max_miembros (int)
├── estado (text) — 'activo', 'suspendido', 'cancelado'
├── fecha_vencimiento_plan (timestamptz, nullable)
├── created_at (timestamptz)
├── updated_at (timestamptz)
```

### 2.3 Tabla Pivote: `organizacion_usuarios`

```
organizacion_usuarios
├── id (uuid, PK)
├── organizacion_id (uuid, FK → organizaciones)
├── usuario_id (uuid, FK → auth.users)
├── rol (text) — 'super_admin', 'admin', 'tesorero', 'usuario'
├── estado (text) — 'activo', 'inactivo'
├── created_at (timestamptz)
├── UNIQUE(organizacion_id, usuario_id)
```

---

## 3. Cambios Requeridos en Base de Datos

### 3.1 Agregar `organizacion_id` a TODAS las tablas de datos

Cada tabla del modelo actual necesita una columna `organizacion_id`:

| Tabla | Cambio |
|---|---|
| `miembros` | + `organizacion_id uuid NOT NULL REFERENCES organizaciones(id)` |
| `votos` | + `organizacion_id uuid NOT NULL` (ya llega por miembros, pero debe ser explícito) |
| `pagos` | + `organizacion_id uuid NOT NULL` |
| `propositos` | + `organizacion_id uuid NOT NULL` |
| `comites` | + `organizacion_id uuid NOT NULL` |
| `comite_usuarios` | heredado por `comites.organizacion_id` |
| `comite_miembros` | heredado por `comites.organizacion_id` |
| `comite_proyectos` | + `organizacion_id uuid NOT NULL` |
| `comite_votos` | + `organizacion_id uuid NOT NULL` |
| `comite_pagos` | + `organizacion_id uuid NOT NULL` |
| `comite_ofrendas` | + `organizacion_id uuid NOT NULL` |
| `comite_gastos` | + `organizacion_id uuid NOT NULL` |
| `proyecto_productos` | + `organizacion_id uuid NOT NULL` |
| `proyecto_ventas` | + `organizacion_id uuid NOT NULL` |
| `proyecto_pagos_ventas` | + `organizacion_id uuid NOT NULL` |
| `usuarios` | **ELIMINAR** — reemplazada por `organizacion_usuarios` |

### 3.2 Función Helper para RLS Multi-Tenant

```sql
-- Obtener el tenant activo del usuario actual
CREATE OR REPLACE FUNCTION private.get_user_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT organizacion_id 
  FROM public.organizacion_usuarios 
  WHERE usuario_id = (SELECT auth.uid())
    AND estado = 'activo'
  LIMIT 1;
$$;
```

### 3.3 Política RLS Estándar para Cada Tabla

```sql
-- Ejemplo para miembros
CREATE POLICY "tenant_isolation" ON miembros
  AS RESTRICTIVE
  TO authenticated
  USING (organizacion_id = (SELECT private.get_user_org_id()));
```

> Se aplica como `RESTRICTIVE` para que se combine con AND con otras políticas permisivas existentes.

### 3.4 Índices Requeridos

```sql
-- Índice en organizacion_id para CADA tabla
CREATE INDEX idx_miembros_org ON miembros(organizacion_id);
CREATE INDEX idx_votos_org ON votos(organizacion_id);
CREATE INDEX idx_pagos_org ON pagos(organizacion_id);
-- ... etc para todas las tablas
```

---

## 4. Cambios Requeridos en el Frontend

### 4.1 Context de Organización

Actualmente existe `AuthContext.tsx`. Se necesita un nuevo `OrganizationContext` que:

- Almacene la organización activa del usuario
- Proporcione el `organizacion_id` a todas las queries
- Permita cambiar de organización (si el usuario pertenece a varias)

### 4.2 Middleware Multi-Tenant

El middleware actual (`middleware.ts`) pre-carga `rol` y `estado` del usuario. Debe extenderse para:

- Resolver la organización activa desde cookie/header
- Validar que el usuario pertenece a esa organización
- Inyectar el `organizacion_id` en el request

### 4.3 Sistema de Rutas

**Actual:** `/dashboard/comites/[id]/dashboard`  
**Propuesto:** `/[org-slug]/dashboard/comites/[id]/dashboard`

O alternativamente, con subdominios:  
`ipuc-barranquilla.tuapp.com/dashboard/comites/[id]/dashboard`

### 4.4 Componentes Afectados

| Área | Impacto |
|---|---|
| `Sidebar.tsx` | Mostrar nombre de organización, selector de org |
| `DashboardHeader.tsx` | Logo y nombre de la iglesia activa |
| `ProtectedRoute.tsx` | Validar membresía en la organización |
| Todos los servicios (`comite-service.ts`, `voto-service.ts`) | Queries filtradas automáticamente por RLS (no necesitan cambio si RLS está bien) |
| Hooks | Agregar `organizacion_id` como dependencia |
| Reportes PDF | Incluir logo y datos de la organización |

---

## 5. Nuevos Módulos Requeridos para SaaS

### 5.1 Onboarding y Registro de Iglesias

- Página de registro público para nuevas iglesias
- Wizard de configuración inicial (nombre, pastor, datos de contacto)
- Asignación automática de plan `free`
- Creación de primer usuario `admin`

### 5.2 Panel de Administración Global (Super Admin)

- Dashboard con métricas de todas las organizaciones
- Gestión de planes y suscripciones
- Monitoreo de uso por iglesia
- Soporte y tickets
- Gestión de feature flags

### 5.3 Sistema de Planes y Suscripciones

| Plan | Usuarios | Miembros | Comités | Funcionalidades |
|---|---|---|---|---|
| **Gratuito** | 2 | 50 | 1 | Votos, pagos básicos |
| **Básico** | 5 | 200 | 3 | + Reportes PDF, propósitos |
| **Profesional** | 15 | 500 | ilimitados | + Proyectos de venta, exportación Excel |
| **Enterprise** | ilimitados | ilimitados | ilimitados | + API, SSO, soporte prioritario |

### 5.4 Sistema de Facturación

- Integración con pasarela de pagos (Stripe, PayU, ePayco para LATAM)
- Facturación recurrente mensual/anual
- Período de prueba (14-30 días)
- Gestión de upgrades/downgrades
- Facturas y recibos

### 5.5 Landing Page Pública

- Página de marketing del producto
- Precios y comparativa de planes
- Formulario de registro / demo
- Blog / documentación
- Testimonios

---

## 6. Seguridad — Prerequisitos Críticos

### 6.1 Problemas a Resolver ANTES del SaaS

| # | Problema | Acción |
|---|---|---|
| 1 | Vista `public.users` expone `auth.users` | Eliminar o mover a esquema privado con `security_invoker = true` |
| 2 | Vistas con `SECURITY DEFINER` | Cambiar a `security_invoker = true` |
| 3 | Tablas backup sin RLS | Habilitar RLS o mover a esquema no expuesto |
| 4 | 18+ funciones sin `search_path` inmutable | Agregar `SET search_path = ''` a todas |
| 5 | Política `allow_anon_insert` en miembros | Restricción: solo authenticated + validación de org |
| 6 | Política `votos_insert_policy` siempre true | Agregar validación de pertenencia a la organización |
| 7 | Protección contra contraseñas filtradas | Habilitar HaveIBeenPwned en Auth settings |
| 8 | MFA insuficiente | Habilitar TOTP como mínimo |

### 6.2 Nuevas Medidas de Seguridad para Multi-Tenant

- **Política RESTRICTIVE de aislamiento** en TODAS las tablas con `organizacion_id`
- **Rate limiting** por organización (Supabase Edge Functions o middleware)
- **Audit logging** de acciones sensibles con `organizacion_id`
- **Encriptación de datos sensibles** usando Supabase Vault (ya disponible como extensión)
- **Validar en el backend** que el `organizacion_id` enviado coincide con el del token del usuario

---

## 7. Infraestructura y DevOps

### 7.1 Ambientes

| Ambiente | Uso |
|---|---|
| **Desarrollo** | Branch de Supabase + Vercel Preview |
| **Staging** | Proyecto Supabase separado, datos de prueba |
| **Producción** | Proyecto Supabase Pro/Team, dominio propio |

### 7.2 Migraciones

- Consolidar las 116+ migraciones actuales en un esquema base limpio
- Sistema de migraciones versionado con Supabase CLI
- CI/CD para aplicar migraciones automáticamente

### 7.3 Monitoring y Observabilidad

- Supabase Dashboard (métricas de DB, Auth, API)
- Logging estructurado (Supabase Logs)
- Alertas de uso/límites por organización
- Métricas de negocio (iglesias activas, MRR, churn)

### 7.4 Backups

- Backups diarios automáticos (Supabase Pro incluye Point-in-Time Recovery)
- Estrategia de DR (Disaster Recovery)
- Exportación de datos por organización

---

## 8. Plan de Ejecución por Fases

### Fase 0: Estabilización y Seguridad (2-3 semanas)
- [ ] Resolver los 8 problemas de seguridad identificados
- [ ] Consolidar migraciones en esquema base limpio
- [ ] Corregir funciones sin `search_path`
- [ ] Eliminar tablas backup expuestas
- [ ] Habilitar protección de contraseñas filtradas
- [ ] Tests automatizados del esquema actual

### Fase 1: Multi-Tenancy en Base de Datos (3-4 semanas)
- [ ] Crear tabla `organizaciones`
- [ ] Crear tabla `organizacion_usuarios`
- [ ] Agregar columna `organizacion_id` a todas las tablas
- [ ] Migrar datos existentes asignando un `organizacion_id` por defecto
- [ ] Crear función `private.get_user_org_id()`
- [ ] Aplicar política RLS RESTRICTIVE de tenant en todas las tablas
- [ ] Crear índices en `organizacion_id`
- [ ] Tests de aislamiento entre tenants

### Fase 2: Adaptación del Frontend (3-4 semanas)
- [ ] Crear `OrganizationContext`
- [ ] Actualizar middleware para multi-tenant
- [ ] Actualizar sistema de rutas (`/[org-slug]/...`)
- [ ] Adaptar Sidebar y header con datos de la organización
- [ ] Adaptar componente `ProtectedRoute`
- [ ] Adaptar reportes PDF con branding por organización
- [ ] Adaptar servicios (si es necesario tras RLS)
- [ ] Tests E2E multi-tenant

### Fase 3: Onboarding y Gestión de Organizaciones (2-3 semanas)
- [ ] Flow de registro de nueva iglesia
- [ ] Wizard de configuración inicial
- [ ] Invitación de usuarios a la organización
- [ ] Panel de settings de la organización
- [ ] Gestión de roles dentro de la organización
- [ ] Personalización (logo, nombre, colores)

### Fase 4: Planes, Billing y Límites (3-4 semanas)
- [ ] Definir tabla de planes y features
- [ ] Integrar pasarela de pagos (Stripe/PayU)
- [ ] Sistema de suscripciones con períodos de prueba
- [ ] Enforcement de límites por plan (usuarios, miembros, comités)
- [ ] Portal de facturación para el cliente
- [ ] Webhooks de pago (renovación, cancelación, fallo)

### Fase 5: Panel Super Admin (2-3 semanas)
- [ ] Dashboard global con KPIs
- [ ] Gestión de organizaciones (CRUD, suspender, activar)
- [ ] Monitoreo de uso y facturación
- [ ] Sistema de soporte / tickets
- [ ] Feature flags por organización

### Fase 6: Landing Page y Lanzamiento (2-3 semanas)
- [ ] Diseño y desarrollo de landing page
- [ ] Página de precios
- [ ] Documentación pública / FAQ
- [ ] SEO y analíticas
- [ ] Soft launch con 3-5 iglesias piloto
- [ ] Iteración basada en feedback

---

## 9. Resumen de lo que Falta

### Base de datos
- [ ] Tabla de organizaciones (tenants)
- [ ] Tabla de relación organización-usuarios
- [ ] Columna `organizacion_id` en TODAS las tablas existentes
- [ ] Políticas RLS RESTRICTIVE de aislamiento por tenant
- [ ] Funciones helper multi-tenant con `search_path` inmutable
- [ ] Índices para consultas por `organizacion_id`
- [ ] Tabla de planes y features
- [ ] Tabla de suscripciones y facturación
- [ ] Audit log con contexto de organización
- [ ] Consolidación de las 116 migraciones

### Frontend
- [ ] Context de organización activa
- [ ] Middleware multi-tenant
- [ ] Sistema de rutas con slug de organización
- [ ] Selector de organización (para usuarios en múltiples)
- [ ] Branding dinámico por organización
- [ ] Enforcement de límites en UI

### Módulos nuevos
- [ ] Registro y onboarding de iglesias
- [ ] Panel super admin global
- [ ] Sistema de billing y suscripciones
- [ ] Landing page pública
- [ ] Sistema de invitaciones por email
- [ ] Notificaciones (email transaccional: bienvenida, factura, recordatorios)

### Infraestructura
- [ ] Ambientes dev/staging/prod separados
- [ ] CI/CD con migraciones automáticas
- [ ] Monitoring y alertas
- [ ] Dominio propio y DNS
- [ ] CDN para assets estáticos

### Seguridad (URGENTE)
- [ ] Resolver 3 errores críticos de seguridad actuales
- [ ] Resolver 20+ warnings de seguridad
- [ ] Habilitar MFA
- [ ] Habilitar protección de contraseñas filtradas
- [ ] Tests de penetración post multi-tenancy

---

## 10. Estimación de Tiempo Total

| Fase | Duración |
|---|---|
| Fase 0: Seguridad | 2-3 semanas |
| Fase 1: Multi-Tenancy DB | 3-4 semanas |
| Fase 2: Frontend | 3-4 semanas |
| Fase 3: Onboarding | 2-3 semanas |
| Fase 4: Billing | 3-4 semanas |
| Fase 5: Super Admin | 2-3 semanas |
| Fase 6: Landing + Launch | 2-3 semanas |
| **TOTAL** | **17-24 semanas (~4-6 meses)** |

> Con un equipo de 1-2 desarrolladores. Con más personas, las fases 2-5 pueden paralelizarse significativamente.

---

## 11. Costos Estimados de Infraestructura SaaS

| Servicio | Plan | Costo mensual (USD) |
|---|---|---|
| Supabase | Pro | $25/mes + uso |
| Vercel | Pro | $20/mes |
| Dominio | .com | ~$12/año |
| Stripe | Por transacción | 2.9% + $0.30 |
| Email (Resend/SendGrid) | Starter | $0 - $20/mes |
| Monitoring (Sentry) | Developer | $0 - $26/mes |
| **Total base** | | **~$50-$75/mes** |

> El costo escala con el número de usuarios activos y almacenamiento.

---

## 12. Modelo de Negocio Sugerido

| Métrica | Valor |
|---|---|
| Precio plan básico | $15-$25 USD/mes |
| Precio plan profesional | $40-$60 USD/mes |
| Break-even estimado | ~5-10 iglesias de pago |
| Mercado objetivo inicial | Iglesias IPUC en Colombia |
| Expansión | Otras denominaciones, otros países LATAM |

---

> **Conclusión:** El software tiene una base sólida con Next.js + Supabase. La arquitectura de comités ya demuestra capacidad de sub-organización. El paso más crítico y que debería hacerse primero es la **Fase 0 (seguridad)** seguida de la **Fase 1 (multi-tenancy en DB)**, ya que todo lo demás depende del aislamiento correcto de datos entre organizaciones.
