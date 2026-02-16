# Documentación central: IPUC Contabilidad

> Documento base para planificación, análisis y transferencia de conocimiento.
> **Última actualización**: Febrero 2026 — Fase 2 del plan SaaS en progreso.

## Resumen ejecutivo

IPUC Contabilidad es una plataforma SaaS multi-tenant para la gestión contable y de compromisos financieros ("votos") de iglesias. Originalmente diseñada para una sola iglesia (IPUC 3ra Villa Estadio-Bosconia), el sistema se ha transformado en una arquitectura multi-organización con aislamiento por filas (Row-Level Security) en PostgreSQL.

Está construida con Next.js (TypeScript) y utiliza Supabase (Postgres + Auth + RLS + Edge Functions) como backend. Incluye un dashboard administrativo, gestión de miembros, votos, pagos, comités y reportes profesionales (PDF/Excel) con branding dinámico por organización.

## Público objetivo

- Administradores y tesoreros de la iglesia (gestión diaria de votos y pagos).
- Personal administrativo que registra miembros y gestiona información de contactos.
- Equipo técnico/DevOps encargado del despliegue y mantenimiento.

## Objetivos del sistema

- Llevar el registro de compromisos/votos y sus pagos.
- Facilitar reportes y seguimiento del recaudo.
- Proveer un dashboard claro con KPIs y estados de votos.
- Automatizar tareas periódicas (Edge Function para actualizar votos vencidos).

## Alcance

- Gestión de miembros, votos y pagos.
- Autenticación mediante Supabase Auth (email/password).
- Panel administrativo con métricas y reportes básicos (PDF/Excel).
- Automatización de actualización de votos vencidos mediante Supabase Edge Function y GitHub Actions.

## Tecnologías principales

- Frontend: Next.js (app router), React, TypeScript
- Backend/DB: Supabase (Postgres + Auth + Edge Functions)
- Estilos: Tailwind CSS
- Librerías clave: `@supabase/supabase-js`, `@supabase/ssr`, `react-hook-form`, `@tanstack/react-query`, `jspdf`, `xlsx`
- Hosting recomendado: Vercel para frontend; Supabase para BBDD y Edge Functions

Fuente: `package.json` (nombre: `ipuc-contabilidad`, scripts: `dev`, `build`, `start`).

## Arquitectura y componentes

- App Next.js con App Router (`src/app/`): páginas y rutas administrativas.
- Componentes reutilizables en `components/`.
- Cliente y utilidades de Supabase en `lib/`.
- Edge Functions en `supabase/functions/` (p. ej. `actualizar-votos-vencidos`).
- CI/CD: workflows en `.github/workflows/` para ejecutar la función periódica.

### Arquitectura multi-tenant (frontend)

```
QueryProvider → AuthProvider → OrganizationProvider → children
```

- **OrganizationContext** (`src/lib/context/OrganizationContext.tsx`): provee `organization`, `membership`, `orgRole`, helpers (`isAdmin`, `isTesorero`, `isAdminOrTesorero`), `refreshOrganization`. Consulta `organizacion_usuarios` → `organizaciones`.
- **middleware.ts**: pre-carga rol del usuario desde `organizacion_usuarios` (fallback a `usuarios`). Cookie `__auth_org_id`.
- **AuthContext** (`src/lib/context/AuthContext.tsx`): `loadUserRole()` consulta `organizacion_usuarios` primero, fallback a `usuarios`.
- **ProtectedRoute** (`src/components/ProtectedRoute.tsx`): valida membresía vía `organizacion_usuarios` (por `usuario_id` + `estado='activo'`), fallback a `miembros`.
- **Sidebar**: muestra `organization.nombre` dinámicamente, con indicador de plan.
- **DashboardHeader**: muestra nombre de la organización y etiqueta de rol.
- **Generadores PDF/Excel**: reciben `nombreOrganizacion` como config, con fallback a `'IPUC'`.

## Modelo de datos (resumen)

### Tablas de organización (multi-tenant)
- `organizaciones`: id, nombre, slug, plan, logo_url, configuracion (jsonb), max_usuarios, max_miembros, estado, fecha_vencimiento_plan, created_at, updated_at.
- `organizacion_usuarios`: organizacion_id, usuario_id, rol (`admin`, `tesorero`, `usuario`, `super_admin`), estado, created_at.

### Tablas de datos (todas con `organizacion_id` para aislamiento RLS)
- `usuarios`: administradores del sistema (id, email, rol, estado, organizacion_id).
- `miembros`: datos personales y contacto (id, nombres, email, teléfono, fecha_ingreso, organizacion_id).
- `votos`: compromisos financieros (id, miembro_id, proposito, monto_total, recaudado, fecha_limite, estado, organizacion_id).
- `pagos`: pagos asociados a votos (id, voto_id, monto, fecha_pago, metodo_pago, nota, organizacion_id).
- `propositos`: catálogo de propósitos de votos (organizacion_id).
- `comites`, `comite_usuarios`, `comite_miembros`: gestión de comités (organizacion_id).
- `comite_proyectos`, `comite_votos`, `comite_pagos`, `comite_ofrendas`, `comite_gastos`: módulo de comités (organizacion_id).
- `proyecto_productos`, `proyecto_ventas`, `proyecto_pagos_ventas`: ventas por proyecto (organizacion_id).

### Funciones helper (esquema `private`)
- `private.get_user_org_id()`: devuelve la `organizacion_id` del usuario autenticado (SQL pura, `SECURITY DEFINER`, `search_path=''`).
- `private.get_user_org_id_or_default()`: igual que `get_user_org_id()` con fallback al org default (para DEFAULT de columnas).
- `private.get_user_org_ids()`: devuelve TODOS los `organizacion_id` del usuario (multi-org, SECURITY DEFINER).
- `private.get_user_org_ids_as_admin()`: devuelve orgs donde el usuario es admin/super_admin (SECURITY DEFINER).
- `private.get_user_org_role()`: devuelve el rol del usuario en su organización activa.

### Políticas RLS
Todas las tablas de datos usan políticas `RESTRICTIVE` con `(select private.get_user_org_id())` para caching de initPlan en PostgreSQL (best practice Supabase).

## Rutas y funcionalidades principales

- `/login`, `/registro` — autenticación.
- `/` — dashboard con KPIs.
- `/miembros` — CRUD de miembros.
- `/votos` — CRUD de votos, seguimiento de avance y registro de pagos.
- `/pagos` — historial y detalles de pagos.

Funciones administrativas: gestión de usuarios, reportes (PDF/Excel), filtros y visualizaciones con `recharts`.

## Funcionalidades detalladas

- **Autenticación y Usuarios**: registro por email/password, inicio de sesión, gestión de sesiones, recuperación de contraseña (si está implementada), administración de usuarios (crear/editar/desactivar), roles propuestos: `Admin`, `Tesorería`, `Usuario`. Validación de datos y protección de rutas en el frontend.

- **Gestión de Miembros**: CRUD completo (crear, leer, actualizar, desactivar), búsqueda por nombre/cedula/email, filtros por estado/fecha de ingreso, importación desde Excel/CSV, exportación en Excel/PDF, detección básica de duplicados, historial de cambios.

- **Gestión de Votos (Compromisos)**: crear votos con `proposito`, `monto_total`, `fecha_limite`; asignación a `miembro`; estados (`activo`, `completado`, `cancelado`); seguimiento del progreso (`recaudado` vs `monto_total`); fraccionamiento/planes de pago (si aplica); edición y cancelación; visualización de historial y línea de tiempo de pagos.

- **Registro de Pagos**: registrar pagos asociados a un `voto` (monto, fecha, método: `efectivo`, `transferencia`, `otro`), notas y adjuntos (comprobantes); reconciliación de pagos; posibilidad de editar/corregir registros con auditoría.

- **Reportes y Exportaciones**: generación de reportes PDF (con `jspdf`) y exportación a Excel (`xlsx`), reportes por rango de fechas, por miembro, por estado de voto; KPIs en dashboard: total comprometido, total recaudado, total pendiente, cantidad de votos activos.

- **Automatizaciones y Tareas Programadas**: Edge Function `actualizar-votos-vencidos` para marcar votos vencidos; GitHub Actions para ejecución programada; `CRON_SECRET` para autenticación de llamadas programadas.

- **Notificaciones y UX**: notificaciones in-app (toasts), confirmaciones modales en acciones destructivas, indicadores de carga, validaciones en formularios (`react-hook-form` + `zod`).

- **Auditoría y Logs**: registro de operaciones críticas (creación/edición/eliminación de votos, pagos y miembros) con `created_by`/`updated_by` y `timestamp`; logs de Edge Functions y GitHub Actions para trazabilidad.

- **Seguridad y Control de Acceso**: aplicar Row Level Security (RLS) en Postgres según roles; protección de API/Edge Functions mediante `CRON_SECRET`; validación server-side de entradas; revisar permisos de Supabase Auth y reglas de lectura/escritura.

- **Integraciones y Extensibilidad**: cliente Supabase para DB/Auth; hooks y utilities para SSR (`@supabase/ssr`); posibilidad de integrar pasarelas de pago o servicios de correo/SMTP en iteraciones futuras.

- **Operaciones y Mantenimiento**: scripts de despliegue y test para Edge Functions en `./scripts/`; lista de checklist para despliegue en `QUICK_START.md`; backups y restore de la base de datos a definir en políticas operativas.

- **Calidad y Testing**: recomendaciones de añadir tests unitarios (componentes y utilidades), pruebas de integración para flujos críticos (registro de pago, actualización de votos) y E2E para el dashboard.

- **Accesibilidad y Responsividad**: diseño responsive (mobile-first), consideraciones de contraste y navegación por teclado, y pruebas básicas de accesibilidad.


## Despliegue y operaciones

- Edge Function: `supabase/functions/actualizar-votos-vencidos`.
- CLI y automatización: `npx supabase` (login, link, functions deploy), scripts en `./scripts/` (`deploy-edge-function.sh`, `test-edge-function.sh`).
- Secrets importantes: `CRON_SECRET`, `SUPABASE_PROJECT_REF` (guardar en Supabase secrets y GitHub Actions).
- Guía rápida y detallada de deployment: `QUICK_START.md`, `DEPLOYMENT_GUIDE.md`.

Comandos útiles:

```bash
npm run dev
npm run build
npm run start
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase functions deploy actualizar-votos-vencidos --no-verify-jwt
```

## Seguridad y control de acceso

- Autenticación: Supabase Auth (email/password).
- Roles por organización: `admin`, `tesorero`, `usuario`, `super_admin` (en tabla `organizacion_usuarios`).
- Row Level Security (RLS): políticas **RESTRICTIVE** en todas las tablas de datos, usando `(select private.get_user_org_id())` para aislamiento por tenant.
- Todas las funciones SQL tienen `SET search_path = ''` (0 warnings de security advisors).
- Vistas peligrosas (`public.users`, `vista_resumen_ventas_proyecto`) eliminadas.
- Tablas backup con RLS habilitado (sin políticas — solo admin directo).
- `CRON_SECRET` para autenticación de Edge Functions y GitHub Actions.

### Estado de seguridad actual (Fase 0 — ~95% completada)
- ✅ 0 ERROR en advisors de seguridad
- ✅ 0 WARN de funciones sin search_path
- ⏳ HaveIBeenPwned (configuración manual en Supabase Dashboard)
- ⏳ MFA (configuración manual en Supabase Dashboard)

## Documentos y archivos clave (referencia rápida)

- `README.md` — introducción y cómo arrancar.
- `PROJECT_DOCUMENTATION.md` — documentación técnica y diseño (modelo de datos, rutas, estilos).
- `QUICK_START.md` — pasos rápidos para deployment y prueba.
- `DEPLOYMENT_GUIDE.md` — guía completa para Edge Function y CI/CD.
- `package.json` — dependencias y scripts.
- `supabase/functions/` — funciones edge para tareas programadas.

## Recomendaciones inmediatas para planificación

1. Validar públicamente el público objetivo y casos de uso prioritarios: tesorería, reportes, notificaciones.
2. Definir roles y permisos concretos (Admin, Tesorería, Usuario) y aplicar RLS en Postgres.
3. Revisar y formalizar backups y política de retención de datos en Supabase.
4. Crear checklist de release: pruebas E2E, pruebas de migración de datos, pruebas de seguridad básicas.
5. Establecer responsable técnico y un canal de comunicación (owner, correo/Slack).

## Riesgos y observaciones

- El sistema depende de Supabase para Auth y funciones; cualquier cambio en el proveedor impacta la operativa.
- Revisar manejo de secretos y permisos en GitHub Actions.
- Evaluar políticas de validación de datos (zod ya presente en dependencias).

## Próximos pasos sugeridos (plan mínimo viable de 90 días)

1. Auditoría de seguridad y RLS (2 semanas).
2. Definir matriz de roles y permisos, aplicar RLS y pruebas (2-3 semanas).
3. Implementar tests automáticos (unit + integración básica) y CI (2-3 semanas).
4. Crear playbook de despliegue y rollback, y pruebas de restore (2 semanas).
5. Preparar training para usuarios clave y manual de operación (2 semanas).

## Contactos y responsabilidades

- Repo/owner técnico: revisar `package.json` y `README.md` para identificar responsables (si no existe, definir responsable técnico).
- Operaciones/Despliegue: persona con acceso Supabase + GitHub Secrets.

---

## Plan de Escalamiento: IPUC Contabilidad → SaaS (documentación añadida)

> Fecha del plan original: 8 de febrero de 2026 — Estado: completado (añadido aquí como referencia operativa)

### Resumen

Objetivo: convertir la aplicación single-tenant en una plataforma SaaS multi-iglesia, con aislamiento por tenant, onboarding, panel global y facturación.

### 1. Diagnóstico del Estado Actual

Stack tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | Next.js 16, React 18, TailwindCSS |
| Backend/API | Supabase (PostgreSQL + Auth + RLS) |
| Autenticación | Supabase Auth (email/password) |
| Despliegue | Vercel (inferido) |
| Reportes | jsPDF, xlsx |

Modelo de Base de Datos Actual (Single-Tenant)

Tablas principales (esquema `public`): `organizaciones`, `organizacion_usuarios`, `usuarios`, `miembros`, `votos`, `pagos`, `propositos`, `comites`, `comite_usuarios`, `comite_miembros`, `comite_proyectos`, `comite_votos`, `comite_pagos`, `comite_ofrendas`, `comite_gastos`, `proyecto_productos`, `proyecto_ventas`, `proyecto_pagos_ventas`.

Migraciones: 131+ migraciones aplicadas (incluye Fase 0 seguridad + Fase 1 multi-tenancy).

Roles por organización: `admin`, `tesorero`, `usuario`, `super_admin` (tabla `organizacion_usuarios`).

Problemas de seguridad detectados (advisors Supabase) — **RESUELTOS**:

| Severidad | Problema | Estado |
|---|---|---|
| ~~ERROR~~ | Vista `public.users` expone `auth.users` a roles `anon` | ✅ Vista eliminada |
| ~~ERROR~~ | Vistas con `SECURITY DEFINER` (`users`, `vista_resumen_ventas_proyecto`) | ✅ Vistas eliminadas |
| ~~ERROR~~ | Tablas backup sin RLS | ✅ RLS habilitado |
| ~~WARN~~ | 18+ funciones sin `search_path` inmutable | ✅ Todas corregidas (0 warnings) |
| ~~WARN~~ | Política RLS siempre `true` en `miembros` y `votos` | ✅ Reemplazadas por RESTRICTIVE |
| WARN | Protección HaveIBeenPwned deshabilitada | ⏳ Config manual Dashboard |
| WARN | MFA insuficiente | ⏳ Config manual Dashboard |

### 2. Arquitectura Multi-Tenant Propuesta

Estrategia: aislamiento por filas usando `organizacion_id` (tenant) con RLS RESTRICTIVE.

Nueva tabla central: `organizaciones` (id, nombre, slug, plan, logo_url, configuracion jsonb, max_usuarios, max_miembros, estado, fecha_vencimiento_plan, created_at, updated_at).

Tabla pivote: `organizacion_usuarios` (organizacion_id, usuario_id, rol, estado, created_at).

### 3. Cambios Requeridos en Base de Datos

- Agregar `organizacion_id` a TODAS las tablas de datos.
- Crear función helper `private.get_user_org_id()` para obtener tenant desde `organizacion_usuarios`.
- Aplicar políticas RLS RESTRICTIVE en cada tabla (ej. `USING (organizacion_id = private.get_user_org_id())`).
- Crear índices en `organizacion_id` para rendimiento.

### 4. Cambios Requeridos en el Frontend

- Crear `OrganizationContext` que exponga la organización activa.
- Extender `middleware.ts` para resolver y validar la organización activa.
- Ajustar rutas para incluir `org-slug` o usar subdominios.
- Actualizar componentes (Sidebar, Header, ProtectedRoute) y servicios para considerar `organizacion_id`.

### 5. Nuevos Módulos Requeridos para SaaS

- Onboarding y registro de iglesias.
- Panel de Administración Global (Super Admin).
- Sistema de planes y suscripciones (planes: Free, Básico, Profesional, Enterprise).
- Sistema de facturación (integración con Stripe/PayU/ePayco).
- Landing page pública y documentación.

### 6. Seguridad — Prerequisitos Críticos (a resolver antes de SaaS)

Acciones urgentes:

- Eliminar o restringir la vista `public.users` que expone `auth.users`.
- Reemplazar `SECURITY DEFINER` por `security_invoker = true` donde aplique.
- Habilitar RLS en tablas backup o moverlas a esquema privado.
- Agregar `SET search_path = ''` a funciones que lo requieran.
- Restringir inserts anon y validar pertenencia a organización.
- Habilitar protección de contraseñas filtradas (HaveIBeenPwned) y MFA.

### 7. Infraestructura y DevOps

- Ambientes: Desarrollo, Staging (proyecto Supabase separado), Producción (Supabase Pro/Team).
- Consolidar migraciones y controlar con Supabase CLI.
- Monitoring: Supabase Dashboard, logs estructurados, alertas por uso y límites.
- Backups diarios y estrategia DR.

### 8. Plan de Ejecución por Fases (con estado actual)

| Fase | Descripción | Estado |
|---|---|---|
| Fase 0 | Estabilización y Seguridad | ✅ ~95% (falta config manual HaveIBeenPwned + MFA) |
| Fase 1 | Multi-Tenancy DB | ✅ 100% completa |
| Fase 2 | Adaptación del Frontend | ✅ ~95% (contextos, middleware, org-slug routing, OrgLink/useOrgRouter, OrgSwitcher, reportes) |
| Fase 3 | Onboarding y Gestión de Organizaciones | ✅ ~90% (registro, invitaciones, settings, super-admin, aprobación manual) |
| Fase 4 | Planes y Billing | ⬜ No iniciada (pago manual vía WhatsApp implementado) |
| Fase 5 | Panel Super Admin | ✅ ~90% (dashboard + gestión orgs, aprobar/rechazar/suspender) |
| Fase 6 | Landing Page y Lanzamiento | ⬜ No iniciada |

**Detalle Fase 2 completado:**
- ✅ `OrganizationContext` con provider, hook `useOrganization()`, cookie multi-org
- ✅ `middleware.ts` con org-slug URL rewrite: `/<slug>/dashboard/...` → `/dashboard/...`
- ✅ `OrgLink` (47 archivos) — wrapper de `next/link` con auto-prefix org-slug
- ✅ `useOrgRouter` (27 archivos) — wrapper de `useRouter` con auto-prefix org-slug
- ✅ `useOrgNavigation` hook — `orgPath()`, `cleanPathname`, `orgSlug`
- ✅ `OrgSwitcher` — selector multi-org (visible si usuario tiene 2+ orgs)
- ✅ `AuthContext` y `auth-service` con fallback org_usuarios → usuarios
- ✅ `ProtectedRoute` valida membresía por `organizacion_usuarios`
- ✅ Sidebar con `orgPath()` para links, `cleanPathname` para active detection, `OrgSwitcher`
- ✅ DashboardHeader muestra nombre de organización y etiqueta de rol
- ✅ LoginForm redirige a `/<slug>/dashboard` post-login
- ✅ Generadores PDF/Excel con `nombreOrganizacion` dinámico
- ✅ `database.types.ts` regenerado
- ✅ RLS corregida: recursión infinita en `organizacion_usuarios` resuelta con funciones SECURITY DEFINER
- ✅ Defaults dinámicos `private.get_user_org_id_or_default()` en 15 tablas
- ✅ Build exitoso (0 errores, 21 static pages)

**Pendiente Fase 2:**
- Pruebas E2E multi-tenant

### 9. Resumen de lo que Falta (checklist actualizado)

- ✅ ~~Tabla `organizaciones` y `organizacion_usuarios`.~~
- ✅ ~~`organizacion_id` en todas las tablas.~~
- ✅ ~~Políticas RLS RESTRICTIVE.~~
- ✅ ~~Índices y funciones helper.~~
- ✅ ~~Frontend: Context, middleware, componentes principales.~~
- ✅ ~~Frontend: rutas con org-slug, OrgLink/useOrgRouter (74 archivos), OrgSwitcher multi-org.~~
- ✅ ~~Módulos: Onboarding (registro-org, invitaciones, settings, aprobación manual).~~
- ✅ ~~Panel Super Admin con gestión de orgs (aprobar/rechazar/suspender/reactivar).~~
- 🔄 Frontend: E2E tests.
- ⬜ Infra: entornos separados, CI/CD mejorado, monitoring, backups.
- ⬜ Módulos: Landing page pública.
- ⏳ Seguridad: config manual HaveIBeenPwned + MFA en Dashboard.

### 10. Estimación de Costos y Modelo de Negocio (resumen)

- Costos base estimados: Supabase Pro + Vercel Pro ~ $50-$75/mes.
- Modelos de precios sugeridos: plan básico $15-$25/mes, profesional $40-$60/mes.

---

Archivo del plan incorporado en este documento como referencia operativa.

Fecha de inclusión: 2026-02-12

---

## Flujo de Registro y Aprobación Manual de Iglesias (Fase 3 + 5)

> Implementado: Febrero 2026

### Flujo completo

```
1. Iglesia visita /registro-org
   → Completa wizard 2 pasos (datos iglesia + WhatsApp + cuenta admin)
   → Org se crea con estado: 'pendiente'
   → Redirect a /pendiente-aprobacion

2. Super Admin ve en /super-admin las orgs pendientes
   → Contacta vía WhatsApp (botón directo) para coordinar pago
   → Tras confirmar pago manual → click "Aprobar"
   → Org pasa a estado: 'activo'

3. Admin de la iglesia inicia sesión normalmente
   → Middleware detecta org.estado='activo' → acceso al dashboard
```

### Rutas nuevas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/registro-org` | Pública | Wizard registro iglesia con WhatsApp |
| `/pendiente-aprobacion` | Pública | Página de espera post-registro |
| `/invitacion/[token]` | Pública | Aceptar invitación a org |
| `/super-admin` | Protegida (super_admin) | Dashboard global con stats |
| `/super-admin/organizaciones` | Protegida (super_admin) | Gestión: aprobar/rechazar/suspender/reactivar |
| `/dashboard/admin/settings` | Admin org | Config general + invitaciones + apariencia |

### Modelo de datos (cambios Fase 3+5)

**Tabla `super_admins`**: `usuario_id` (PK, FK auth.users).

**Columnas nuevas en `organizaciones`**: `motivo_rechazo` (text), `aprobado_por` (uuid FK auth.users), `fecha_aprobacion` (timestamptz), `whatsapp` (text).

**Tabla `invitaciones`**: id, organizacion_id, email, rol, token (unique), estado, invitado_por, expires_at.

**Función `private.is_super_admin()`**: SECURITY DEFINER, retorna boolean.

**Función `generate_unique_slug(base_name)`**: Genera slugs únicos con manejo de colisiones.

### Estados de organización

| Estado | Descripción | Acceso al dashboard |
|--------|------------|-------------------|
| `pendiente` | Recién registrada, esperando pago/aprobación | ❌ Redirige a /pendiente-aprobacion |
| `activo` | Aprobada y operativa | ✅ Acceso completo |
| `suspendido` | Suspendida por el super admin | ❌ Redirige a /pendiente-aprobacion |
| `rechazado` | Rechazada con motivo | ❌ Redirige a /pendiente-aprobacion |

### Edge Function

- `send-invitation-email`: Envía emails de invitación usando Resend API. Requiere `RESEND_API_KEY` como secret. Falla silenciosamente si no está configurada.

### Proceso de pago

El pago es **100% manual**:
- El super admin contacta al cliente por WhatsApp o email
- Tras confirmar el pago, aprueba la org desde `/super-admin/organizaciones`
- No se utiliza pasarela de pagos (Stripe, PayU, etc.)
- El campo `whatsapp` se captura en el registro para facilitar contacto
