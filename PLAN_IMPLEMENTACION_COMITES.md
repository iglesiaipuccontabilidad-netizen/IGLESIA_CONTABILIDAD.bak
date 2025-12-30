# 🏛️ Plan de Implementación: Sistema de Comités IPUC

## 📋 Resumen del Proyecto

**Objetivo**: Crear un sistema de contabilidad independiente para comités de la iglesia (DECOM, Jóvenes, etc.) donde cada comité maneje sus propios fondos, proyectos, votos, ofrendas y gastos de forma totalmente aislada.

**Fecha de inicio**: 30 de Diciembre 2025  
**Comités iniciales**: DECOM (Departamento de Comunicaciones), Jóvenes

---

## 🎯 Alcance Definido

### ✅ Lo que SÍ incluye:
- Gestión de comités independientes
- Roles por comité: Líder, Tesorero, Secretario
- Miembros del comité (lista de personas)
- Votos y pagos específicos del comité
- Proyectos de recaudación del comité
- Registro de ofrendas/cultos del comité
- Registro de gastos/egresos del comité
- Dashboard específico por comité
- Reportes por comité

### ❌ Lo que NO incluye (futuras fases):
- Integración con contabilidad general de la iglesia
- Reportes al tesorero general
- Consolidación entre comités
- Categorías de gastos
- Calendario de actividades
- Notificaciones

---

## 🗂️ Estructura de Datos

### Nuevas Tablas a Crear

```
┌─────────────────────────────────────────────────────────────┐
│                         COMITES                             │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                               │
│ nombre (TEXT) - "DECOM", "Jóvenes", etc.                   │
│ descripcion (TEXT, nullable)                                │
│ estado ('activo', 'inactivo')                              │
│ created_at, updated_at                                      │
│ creado_por (UUID, FK → auth.users)                         │
└─────────────────────────────────────────────────────────────┘
            │
            │ 1:N
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMITE_USUARIOS                          │
│         (Usuarios del sistema asignados al comité)          │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                               │
│ comite_id (UUID, FK → comites)                             │
│ usuario_id (UUID, FK → usuarios)                           │
│ rol ('lider', 'tesorero', 'secretario')                    │
│ estado ('activo', 'inactivo')                              │
│ fecha_ingreso (DATE)                                        │
│ created_at                                                  │
│ UNIQUE(comite_id, usuario_id) - Un usuario un rol x comité │
└─────────────────────────────────────────────────────────────┘
            │
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMITE_MIEMBROS                          │
│    (Miembros/personas del comité - pueden o no ser usuarios)│
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                               │
│ comite_id (UUID, FK → comites)                             │
│ nombres (TEXT)                                              │
│ apellidos (TEXT)                                            │
│ telefono (TEXT, nullable)                                   │
│ email (TEXT, nullable)                                      │
│ estado ('activo', 'inactivo')                              │
│ fecha_ingreso (DATE)                                        │
│ created_at, updated_at                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   COMITE_PROYECTOS                          │
│          (Propósitos/campañas del comité)                   │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                               │
│ comite_id (UUID, FK → comites)                             │
│ nombre (TEXT) - "Retiro Jóvenes 2025"                      │
│ descripcion (TEXT, nullable)                                │
│ monto_objetivo (NUMERIC, nullable)                          │
│ monto_recaudado (NUMERIC, default 0)                        │
│ fecha_inicio, fecha_fin (DATE, nullable)                    │
│ estado ('activo', 'completado', 'cancelado')               │
│ created_at, updated_at                                      │
│ creado_por (UUID)                                           │
└─────────────────────────────────────────────────────────────┘
            │
            │ 1:N
            ▼
┌─────────────────────────────────────────────────────────────┐
│                     COMITE_VOTOS                            │
│        (Compromisos de pago de miembros al comité)          │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                               │
│ comite_id (UUID, FK → comites)                             │
│ comite_miembro_id (UUID, FK → comite_miembros)             │
│ proyecto_id (UUID, FK → comite_proyectos, nullable)        │
│ concepto (TEXT) - descripción del voto                      │
│ monto_total (NUMERIC)                                       │
│ recaudado (NUMERIC, default 0)                              │
│ fecha_limite (DATE)                                         │
│ estado ('activo', 'completado', 'vencido', 'cancelado')    │
│ created_at, updated_at                                      │
│ creado_por (UUID)                                           │
└─────────────────────────────────────────────────────────────┘
            │
            │ 1:N
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMITE_PAGOS                             │
│            (Pagos realizados a votos del comité)            │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                               │
│ comite_voto_id (UUID, FK → comite_votos)                   │
│ monto (NUMERIC)                                             │
│ fecha_pago (DATE)                                           │
│ metodo_pago ('efectivo', 'transferencia', 'otro')          │
│ nota (TEXT, nullable)                                       │
│ registrado_por (UUID)                                       │
│ created_at                                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   COMITE_OFRENDAS                           │
│     (Ingresos directos: ofrendas, cultos, donaciones)       │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                               │
│ comite_id (UUID, FK → comites)                             │
│ proyecto_id (UUID, FK → comite_proyectos, nullable)        │
│ concepto (TEXT) - "Ofrenda culto de jóvenes 15 Dic"        │
│ monto (NUMERIC)                                             │
│ fecha (DATE)                                                │
│ tipo ('ofrenda', 'donacion', 'culto', 'actividad', 'otro') │
│ nota (TEXT, nullable)                                       │
│ registrado_por (UUID)                                       │
│ created_at                                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    COMITE_GASTOS                            │
│          (Egresos/gastos realizados por el comité)          │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                               │
│ comite_id (UUID, FK → comites)                             │
│ proyecto_id (UUID, FK → comite_proyectos, nullable)        │
│ concepto (TEXT) - "Compra de refrigerios"                  │
│ monto (NUMERIC)                                             │
│ fecha (DATE)                                                │
│ metodo_pago ('efectivo', 'transferencia', 'otro')          │
│ comprobante (TEXT, nullable) - número de factura/recibo    │
│ nota (TEXT, nullable)                                       │
│ registrado_por (UUID)                                       │
│ created_at                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 👁️ Diseño de Vistas (UI/UX)

### Vista del ADMIN / Tesorero General

```
┌──────────────────────────────────────────────────────────────────┐
│  📊 PANEL DE ADMINISTRACIÓN - COMITÉS                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [+ Nuevo Comité]                              🔍 Buscar...      │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │    📢 DECOM     │  │   👥 JÓVENES    │  │   ➕ NUEVO      │  │
│  │                 │  │                 │  │                 │  │
│  │  👤 3 usuarios  │  │  👤 4 usuarios  │  │   Crear nuevo   │  │
│  │  👥 15 miembros │  │  👥 25 miembros │  │     comité      │  │
│  │  📈 $2,500      │  │  📈 $4,200      │  │                 │  │
│  │  ● Activo       │  │  ● Activo       │  │                 │  │
│  │                 │  │                 │  │                 │  │
│  │ [Ver] [Editar]  │  │ [Ver] [Editar]  │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Vista de Detalle del Comité (Admin)

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Volver    📢 COMITÉ DECOM                     [Editar] [🗑️]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ INFORMACIÓN GENERAL                                       │   │
│  │ Nombre: DECOM (Departamento de Comunicaciones)           │   │
│  │ Estado: ● Activo                                         │   │
│  │ Creado: 30 Dic 2025                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 👤 USUARIOS DEL SISTEMA (3)              [+ Agregar]     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Juan Pérez       │ Líder      │ ● Activo │ [Editar] [X] │   │
│  │ María García     │ Tesorero   │ ● Activo │ [Editar] [X] │   │
│  │ Pedro López      │ Secretario │ ● Activo │ [Editar] [X] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 👥 MIEMBROS DEL COMITÉ (15)              [+ Agregar]     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Carlos Ruiz      │ 300-1234   │ ● Activo │ [Editar] [X] │   │
│  │ Ana Martínez     │ 300-5678   │ ● Activo │ [Editar] [X] │   │
│  │ ...              │ ...        │ ...      │ ...          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Vista del Tesorero del Comité (Dashboard Específico)

```
┌──────────────────────────────────────────────────────────────────┐
│  📊 Dashboard - Comité de Jóvenes                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  💰 BALANCE │ │ 📥 INGRESOS │ │ 📤 GASTOS   │ │ 📋 VOTOS    ││
│  │             │ │             │ │             │ │   ACTIVOS   ││
│  │  $3,200     │ │   $4,500    │ │   $1,300    │ │     8       ││
│  │  Disponible │ │   Este mes  │ │   Este mes  │ │  Pendientes ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ACCIONES RÁPIDAS                                            ││
│  │                                                             ││
│  │ [📥 Registrar Ofrenda]  [💳 Registrar Pago]                ││
│  │ [📤 Registrar Gasto]    [📋 Nuevo Voto]                    ││
│  │ [🎯 Nuevo Proyecto]     [👥 Ver Miembros]                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📋 VOTOS ACTIVOS                          [Ver todos →]    ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ Carlos Ruiz    │ Retiro 2025  │ $500/$200 │ 40% │ 15 Ene  ││
│  │ Ana Martínez   │ Retiro 2025  │ $300/$300 │ ✅  │ Completo ││
│  │ ...                                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📊 ÚLTIMAS TRANSACCIONES                  [Ver todas →]    ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 📥 Ofrenda culto      │ +$450  │ 29 Dic │ Ofrenda         ││
│  │ 📤 Refrigerios        │ -$120  │ 28 Dic │ Gasto           ││
│  │ 💳 Pago Carlos Ruiz   │ +$100  │ 27 Dic │ Pago voto       ││
│  │ ...                                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Menú Lateral (Sidebar) - Según Rol

```
┌────────────────────────┐    ┌────────────────────────┐
│  ADMIN                 │    │  TESORERO COMITÉ       │
├────────────────────────┤    ├────────────────────────┤
│                        │    │                        │
│  🏠 Dashboard General  │    │  🏠 Mi Comité          │
│  ─────────────────     │    │  ─────────────────     │
│  👥 Miembros           │    │  👥 Miembros           │
│  📋 Votos              │    │  📋 Votos              │
│  💳 Pagos              │    │  💳 Pagos              │
│  🎯 Propósitos         │    │  📥 Ofrendas           │
│  📊 Reportes           │    │  📤 Gastos             │
│  ─────────────────     │    │  🎯 Proyectos          │
│  🏛️ Comités           │    │  📊 Reportes           │
│    └─ Lista            │    │  ─────────────────     │
│    └─ Nuevo            │    │  ⚙️ Configuración     │
│  ─────────────────     │    │                        │
│  ⚙️ Administración    │    └────────────────────────┘
│    └─ Usuarios         │
│                        │
└────────────────────────┘
```

---

## � DIVISIÓN DE TRABAJO: BACKEND vs FRONTEND

### 🔧 BACKEND ENGINEER
**Responsabilidades:**
- Base de datos (migraciones, RLS, funciones SQL)
- Servicios y lógica de negocio
- API Actions (Server Actions)
- Tipos TypeScript
- Seguridad y permisos
- Funciones de cálculo y agregación

### 🎨 FRONTEND ENGINEER
**Responsabilidades:**
- Componentes UI
- Páginas y layouts
- Formularios y validaciones
- Tablas y visualizaciones
- Navegación y routing
- Diseño responsivo
- UX/UI según mockups

---

## 📅 FASES DE IMPLEMENTACIÓN

### 🔷 FASE 1: Base de Datos (2-3 días) ✅ **COMPLETADA**
**Prioridad: ALTA** | **👤 BACKEND** | **Status: ✅ COMPLETADA 30 Dic 2025**

| Tarea | Descripción | Estimación | Status |
|-------|-------------|------------|--------|
| 1.1 | Crear migración: tabla `comites` | 1 hora | ✅ |
| 1.2 | Crear migración: tabla `comite_usuarios` | 1 hora | ✅ |
| 1.3 | Crear migración: tabla `comite_miembros` | 1 hora | ✅ |
| 1.4 | Crear migración: tabla `comite_proyectos` | 1 hora | ✅ |
| 1.5 | Crear migración: tabla `comite_votos` | 1 hora | ✅ |
| 1.6 | Crear migración: tabla `comite_pagos` | 1 hora | ✅ |
| 1.7 | Crear migración: tabla `comite_ofrendas` | 1 hora | ✅ |
| 1.8 | Crear migración: tabla `comite_gastos` | 1 hora | ✅ |
| 1.9 | Configurar políticas RLS | 2 horas | ✅ **32 políticas** |
| 1.10 | Crear índices de optimización | 1 hora | ✅ **23 índices** |
| 1.11 | Crear funciones SQL (balance, etc.) | 2 horas | ✅ **3 funciones** |

**Entregable**: Esquema de BD completo y funcional ✅ **ENTREGADO**

**Detalles de implementación:**
- ✅ Tabla `comites`: Creada con campos id, nombre, descripcion, estado, created_at, updated_at, creado_por
- ✅ Tabla `comite_usuarios`: Con constraint UNIQUE(comite_id, usuario_id) y roles enum
- ✅ Tabla `comite_miembros`: Lista de personas en el comité
- ✅ Tabla `comite_proyectos`: Propósitos/campañas con tracking de monto_objetivo y monto_recaudado
- ✅ Tabla `comite_votos`: Compromisos de pago con estados y fecha_limite
- ✅ Tabla `comite_pagos`: Pagos realizados con método y nota
- ✅ Tabla `comite_ofrendas`: Ingresos directos con tipo enum (ofrenda, donacion, culto, actividad)
- ✅ Tabla `comite_gastos`: Egresos con comprobante y método de pago
- ✅ Funciones SQL:
  - `registrar_pago_comite()`: Registro transaccional de pagos
  - `obtener_balance_comite()`: Cálculo de balance total
  - `actualizar_votos_comite_vencidos()`: Actualización batch de votos vencidos
- ✅ RLS Policies: Aislamiento total entre comités por rol de usuario
- ✅ TypeScript Types: Generados en `src/lib/database.types.ts`

---

### 🔷 FASE 2: Tipos y Servicios (1-2 días) ✅ **COMPLETADA**
**Prioridad: ALTA** | **👤 BACKEND** | **Status: ✅ COMPLETADA 30 Dic 2025**

| Tarea | Descripción | Estimación | Status |
|-------|-------------|------------|--------|
| 2.1 | Actualizar `database.types.ts` | 30 min | ✅ |
| 2.2 | Crear `src/types/comites.ts` | 1 hora | ✅ |
| 2.3 | Crear `src/lib/services/comite-service.ts` | 2 horas | ✅ |
| 2.4 | Crear `src/app/actions/comites-actions.ts` | 3 horas | ✅ |

**Entregable**: Capa de datos completa con tipado TypeScript ✅ **ENTREGADO**
**Bloquea a**: Frontend (necesita tipos para componentes)

**Detalles de implementación:**
- ✅ **src/types/comites.ts** (348 líneas):
  - Tipos base: ComiteRow, ComiteInsert, ComiteUpdate para todas las 8 tablas
  - Enums: COMITE_ESTADOS, COMITE_ROL, PROYECTO_ESTADOS, VOTO_ESTADOS, METODO_PAGO, TIPO_OFRENDA
  - Interfaces extendidas: Comite, ComiteUsuario, ComiteProyecto, ComiteVoto, ComitePago con relaciones
  - DTOs: CreateComiteDTO, UpdateComiteDTO, AsignarUsuarioComiteDTO, CreateComiteMiembroDTO, etc.
  - Tipos de respuesta: BalanceComite, EstadisticasComite, TransaccionReciente, DashboardComite
  - Filtros: ComiteFiltros, VotosFiltros, ProyectosFiltros
  - Resultado de operaciones: OperationResult<T>, ValidationError

- ✅ **src/lib/services/comite-service.ts** (671 líneas):
  - **Comités**: getComites(), getComiteById(), countComites()
  - **Usuarios**: getUsuariosComite(), verificarAccesoComite(), getRolUsuarioEnComite(), getComitesDeUsuario()
  - **Miembros**: getMiembrosComite(), getMiembroComiteById(), countMiembrosActivos()
  - **Proyectos**: getProyectosComite(), getProyectoById()
  - **Votos**: getVotosComite(), getVotoById(), getVotosProximosVencer()
  - **Balance**: getBalanceComite() (usa función SQL), getEstadisticasComite()
  - **Dashboard**: getDashboardComite(), getTransaccionesRecientes()
  - Manejo de errores consistente con try/catch
  - Queries optimizadas con selects específicos

- ✅ **src/app/actions/comites-actions.ts** (680 líneas):
  - **Helpers de seguridad**:
    * verificarAutenticacion(): Valida usuario activo
    * verificarPermisoAdmin(): Solo admin/tesorero general
    * verificarAccesoUsuarioComite(): Valida acceso por comité
  - **CRUD Comités**:
    * getComites(), getComiteById(), createComite(), updateComite(), deleteComite()
    * Validaciones: nombres únicos, longitud máxima, estados válidos
  - **Usuarios de Comité**:
    * asignarUsuarioComite(), removerUsuarioComite(), getUsuariosComite()
    * Validación de roles: lider, tesorero, secretario
  - **Miembros**:
    * createComiteMiembro(), getMiembrosComite()
    * Permisos: solo lider/tesorero pueden agregar
  - **Dashboard y Utilidades**:
    * getComitesUsuario(), getDashboardComite(), getBalanceComite(), getEstadisticasComite()
  - revalidatePath() en todas las mutaciones
  - Error handling robusto con tipos OperationResult

---

### 🔷 FASE 3: Gestión de Comités - Admin (2-3 días) 🔄 **PENDIENTE**
**Prioridad: ALTA** | **👥 BACKEND + FRONTEND** *(Trabajo Paralelo)* | **Status: ⏳ ESPERANDO AUTORIZACIÓN**

#### 🔧 BACKEND (1 día)
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 3.B1 | Actions: `getComites()` | 1 hora |
| 3.B2 | Actions: `createComite()` | 1 hora |
| 3.B3 | Actions: `updateComite()` | 1 hora |
| 3.B4 | Actions: `deleteComite()` | 1 hora |
| 3.B5 | Actions: `asignarUsuarioComite()` | 1 hora |
| 3.B6 | Actions: `getUsuariosComite()` | 1 hora |

#### 🎨 FRONTEND (2-3 días) - *Requiere Fase 2 completa*
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 3.F1 | Página lista de comités `/dashboard/comites` | 3 horas |
| 3.F2 | Página crear comité `/dashboard/comites/nuevo` | 2 horas |
| 3.F3 | Página detalle comité `/dashboard/comites/[id]` | 3 horas |
| 3.F4 | Página editar comité `/dashboard/comites/[id]/editar` | 2 horas |
| 3.F5 | Componente `ComiteCard.tsx` | 1 hora |
| 3.F6 | Componente `ComiteForm.tsx` | 2 horas |
| 3.F7 | Componente `AsignarUsuarioModal.tsx` | 2 horas |
| 3.F8 | Actualizar Sidebar con menú Comités | 1 hora |

**Entregable**: CRUD completo de comités para Admin

---

### 🔷 FASE 4: Miembros del Comité (1-2 días) ✅ **COMPLETADA**
**Prioridad: ALTA** | **👥 BACKEND + FRONTEND** *(Trabajo Paralelo)* | **Status: ✅ BACKEND COMPLETADO 30 Dic 2025**

#### 🔧 BACKEND (0.5 días) ✅ **COMPLETADO**
| Tarea | Descripción | Estimación | Status |
|-------|-------------|------------|--------|
| 4.B1 | Actions: `getComiteMiembros()` | 1 hora | ✅ |
| 4.B2 | Actions: `createComiteMiembro()` | 1 hora | ✅ |
| 4.B3 | Actions: `updateComiteMiembro()` | 1 hora | ✅ |
| 4.B4 | Actions: `deleteComiteMiembro()` | 30 min | ✅ |

**Detalles de implementación:**
- ✅ 4 actions completas con validaciones
- ✅ Solo lider/tesorero pueden agregar/editar miembros
- ✅ Soft delete (estado → inactivo)
- ✅ Validación de nombres y apellidos requeridos

#### 🎨 FRONTEND (1 día) - *Requiere Backend 4.B*
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 4.F1 | Página miembros `/dashboard/comites/[id]/miembros` | 3 horas |
| 4.F2 | Componente `ComiteMiembroForm.tsx` | 2 horas |
| 4.F3 | Componente `ComiteMiembrosTable.tsx` | 2 horas |

**Entregable**: Gestión de miembros por comité

---

### 🔷 FASE 5: Dashboard del Comité (2-3 días)
**Prioridad: ALTA** | **👥 BACKEND + FRONTEND** *(Trabajo Paralelo)*

#### 🔧 BACKEND (1 día)
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 5.B1 | Función SQL: `get_balance_comite()` | 2 horas |
| 5.B2 | Actions: `getDashboardComite()` | 2 horas |
| 5.B3 | Actions: `getTransaccionesRecientes()` | 1 hora |
| 5.B4 | Actions: `getEstadisticasComite()` | 2 horas |

#### 🎨 FRONTEND (2 días) - *Requiere Backend 5.B*
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 5.F1 | Layout específico para comité | 2 horas |
| 5.F2 | Dashboard del comité con estadísticas | 4 horas |
| 5.F3 | Componente `BalanceCard.tsx` | 1 hora |
| 5.F4 | Componente `TransaccionesRecientes.tsx` | 2 horas |
| 5.F5 | Componente `VotosActivosComite.tsx` | 2 horas |
| 5.F6 | Sidebar específico para comité | 2 ho ✅ **COMPLETADA**
**Prioridad: MEDIA** | **👥 BACKEND + FRONTEND** *(Trabajo Paralelo)* | **Status: ✅ BACKEND COMPLETADO 30 Dic 2025**

#### 🔧 BACKEND (0.5 días) ✅ **COMPLETADO**
| Tarea | Descripción | Estimación | Status |
|-------|-------------|------------|--------|
| 6.B1 | Actions: CRUD proyectos | 3 horas | ✅ |
| 6.B2 | Función SQL: actualizar `monto_recaudado` | 1 hora | ✅ Ya existe |

**Detalles de implementación:**
- ✅ 4 actions: create, update, delete, getProyectos
- ✅ Solo lider/tesorero pueden crear/editar
- ✅ Estados: activo, completado, cancelado
- ✅ Tracking de monto_objetivo y monto_recaudado
- ✅ Validación de proyectos pertenecen al comitéralelo)*

#### 🔧 BACKEND (0.5 días)
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 6.B1 | Actions: CRUD proyectos | 3 horas |
| 6.B2 | Función SQL: actualizar `monto_recaudado` | 1 hora |

#### 🎨 FRONTEND (1 día) - *Requiere Backend 6.B*
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 6.F1 | Página lista proyectos | 2 horas |
| 6.F2 | Página crear/editar proyecto | 2 horas |
| 6.F3 | Página detalle proyecto | 2 horas | ✅ **COMPLETADA**
**Prioridad: ALTA** | **👥 BACKEND + FRONTEND** *(Trabajo Paralelo)* | **Status: ✅ BACKEND COMPLETADO 30 Dic 2025**

#### 🔧 BACKEND (1 día) ✅ **COMPLETADO**
| Tarea | Descripción | Estimación | Status |
|-------|-------------|------------|--------|
| 7.B1 | Función SQL `registrar_pago_comite()` | 2 horas | ✅ Ya existe |
| 7.B2 | Función SQL `actualizar_estado_voto()` | 1 hora | ✅ Ya existe |
| 7.B3 | Actions: CRUD votos comité | 2 horas | ✅ |
| 7.B4 | Actions: registrar pago | 2 horas | ✅ |

**Detalles de implementación:**
- ✅ 5 actions: create, update, delete, getVotos, registrarPago
- ✅ Solo lider/tesorero pueden crear/editar votos
- ✅ Solo tesorero puede registrar pagos
- ✅ Validación de miembro y proyecto pertenecen al comité
- ✅ No se puede cancelar voto con pagos
- ✅ registrarPagoComite() usa función SQL transaccional
- ✅ Control de monto pendiente vs monto pagado
#### 🔧 BACKEND (1 día)
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 7.B1 | Función SQL `registrar_pago_comite()` | 2 horas |
| 7.B2 | Función SQL `actualizar_estado_voto()` | 1 hora |
| 7.B3 | Actions: CRUD votos comité | 2 horas |
| 7.B4 | Actions: registrar pago | 2 horas |

#### 🎨 FRONTEND (1.5 días) - *Requiere Backend 7.B*
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 7.F1 | Página lista votos del comité | 3 ho ✅ **COMPLETADA**
**Prioridad: MEDIA** | **👥 BACKEND + FRONTEND** *(Trabajo Paralelo)* | **Status: ✅ BACKEND COMPLETADO 30 Dic 2025**

#### 🔧 BACKEND (0.5 días) ✅ **COMPLETADO**
| Tarea | Descripción | Estimación | Status |
|-------|-------------|------------|--------|
| 8.B1 | Actions: CRUD ofrendas | 3 horas | ✅ |

**Detalles de implementación:**
- ✅ 4 actions: registrar, update, delete, getOfrendas
- ✅ Solo tesorero puede registrar/editar
- ✅ Solo admin puede eliminar
- ✅ Tipos: ofrenda, donacion, culto, actividad, otro
- ✅ Puede asociarse a proyecto específico
---

### 🔷 FASE 8: Ofrendas del Comité (1-2 días)
**Prioridad: MEDIA** | **👥 BACKEND + FRONTEND** *(Trabajo Paralelo)*

#### 🔧 BACKEND (0.5 días)
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 8.B1 | Actions: CRUD ofrendas | 3 horas |

#### 🎨 FRONTEND (1 día) - *Requiere Backend 8.B*
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 8.F1 | Página lista ofrendas | 2 horas |
| 8.F2 | Página crear/editar ofrenda | 2 ho ✅ **COMPLETADA**
**Prioridad: MEDIA** | **👥 BACKEND + FRONTEND** *(Trabajo Paralelo)* | **Status: ✅ BACKEND COMPLETADO 30 Dic 2025**

#### 🔧 BACKEND (0.5 días) ✅ **COMPLETADO**
| Tarea | Descripción | Estimación | Status |
|-------|-------------|------------|--------|
| 9.B1 | Actions: CRUD gastos | 3 horas | ✅ |

**Detalles de implementación:**
- ✅ 4 actions: registrar, update, delete, getGastos
- ✅ Solo tesorero puede registrar/editar
- ✅ Solo admin puede eliminar
- ✅ Métodos de pago: efectivo, transferencia, otro
- ✅ Campo comprobante para factura/recibo
### 🔷 FASE 9: Gastos del Comité (1-2 días)
**Prioridad: MEDIA** | **👥 BACKEND + FRONTEND** *(Trabajo Paralelo)*

#### 🔧 BACKEND (0.5 días)
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 9.B1 | Actions: CRUD gastos | 3 horas |

#### 🎨 FRONTEND (1 día) - *Requiere Backend 9.B*
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 9.F1 | Página lista gastos | 2 horas |
| 9.F2 | Página crear/editar gasto | 2 horas |
| 9.F3 | Componentes relacionados | 2 horas |

**Entregable**: Registro de egresos del comité

---

### 🔷 FASE 10: Reportes del Comité (2-3 días)
**Prioridad: MEDIA** | **👥 BACKEND + FRONTEND** *(Trabajo Paralelo)*

#### 🔧 BACKEND (1 día)
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 10.B1 | Funciones SQL: reportes agregados | 3 horas |
| 10.B2 | Actions: `getReporteBalance()` | 1 hora |
| 10.B3 | Actions: `getReporteVotos()` | 1 hora |
| 10.B4 | API: exportar PDF/Excel | 2 horas |

#### 🎨 FRONTEND (1.5 días) - *Requiere Backend 10.B*
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 10.F1 | Hook `useReportesComite()` | 2 horas |
| 10.F2 | Página reportes del comité | 3 horas |
| 10.F3 | Componente reporte balance | 2 horas |
| 10.F4 | Componente reporte votos | 2 horas |
| 10.F5 | UI de exportación | 1 hora |

**Entregable**: Módulo de reportes para el comité

---

### 🔷 FASE 11: Permisos y Seguridad (1 día)
**Prioridad: ALTA** | **👥 BACKEND + FRONTEND** *(Trabajo Paralelo)*

#### 🔧 BACKEND (0.5 días)
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 11.B1 | Middleware de verificación de comité | 2 horas |
| 11.B2 | Pruebas de seguridad RLS | 2 horas |

#### 🎨 FRONTEND (0.5 días)
| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 11.F1 | HOC `withComiteAccess` | 2 horas |
| 11.F2 | Guards de navegación | 2 horas |

**Entregable**: Sistema de permisos robusto

---

### 🔷 FASE 12: Datos Iniciales (0.5 días)
**Prioridad: MEDIA** | **👤 BACKEND**

| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| 12.1 | Seed para comité DECOM | 1 hora |
| 12.2 | Seed para comité Jóvenes | 1 hora |
| 12.3 | Asignación de usuarios de prueba | 1 hora |

**Entregable**: Comités iniciales configurados

---

## 📊 Resumen de Tiempos por Equipo

### 🔧 BACKEND ENGINEER
| Fase | Tareas | Estimación |
|------|--------|------------|
| 1 | Base de Datos completa | 2-3 días |
| 2 | Tipos y Servicios | 1-2 días |
| 3.B | Actions de Comités | 1 día |
| 4.B | Actions de Miembros | 0.5 días |
| 5.B | Dashboard Backend | 1 día |
| 6.B | Proyectos Backend | 0.5 días |
| 7.B | Votos/Pagos Backend | 1 día |
| 8.B | Ofrendas Backend | 0.5 días |
| 9.B | Gastos Backend | 0.5 días |
| 10.B | Reportes Backend | 1 día |
| 11.B | Seguridad Backend | 0.5 días |
| 12 | Seeds | 0.5 días |
| **TOTAL BACKEND** | | **10-12 días** |

### 🎨 FRONTEND ENGINEER
| Fase | Tareas | Estimación |
|------|--------|------------|
| 3.F | UI Gestión Comités | 2-3 días |
| 4.F | UI Miembros | 1 día |
| 5.F | Dashboard UI | 2 días |
| 6.F | Proyectos UI | 1 día |
| 7.F | Votos/Pagos UI | 1.5 días |
| 8.F | Ofrendas UI | 1 día |
| 9.F | Gastos UI | 1 día |
| 10.F | Reportes UI | 1.5 días |
| 11.F | Guards Frontend | 0.5 días |
| **TOTAL FRONTEND** | | **11.5-13.5 días** |

---

## 🚀 Orden de Ejecución por Equipo

### 🔷 SEMANA 1: Fundamentos (Backend secuencial)

#### 🔧 BACKEND (Días 1-3)
```
DÍA 1-2: Fase 1 - Base de Datos
  ├─ Crear todas las tablas
  ├─ Configurar RLS
  └─ Funciones SQL básicas

DÍA 3: Fase 2 - Tipos y Servicios
  ├─ Actualizar database.types.ts
  ├─ Crear tipos comites.ts
  └─ Crear services y actions básicos
```

#### 🎨 FRONTEND (Día 3 en adelante)
```
DÍA 3: Preparación
  └─ Esperar Fase 2 completa (tipos disponibles)
```

**🔒 Checkpoint Semana 1**: Backend tiene BD y tipos listos

---

### 🔷 SEMANA 2: CRUD Comités (Trabajo Paralelo)

#### 🔧 BACKEND (Día 4)
```
DÍA 4: Fase 3.B - Actions Comités
  ├─ getComites()
  ├─ createComite()
  ├─ updateComite()
  └─ asignarUsuarioComite()
```

#### 🎨 FRONTEND (Días 4-6)
```
DÍA 4-6: Fase 3.F - UI Comités
  ├─ Páginas: lista, crear, editar, detalle
  ├─ Componentes: ComiteCard, ComiteForm
  └─ Actualizar Sidebar
```

**🔒 Checkpoint Semana 2**: CRUD de comités funcionando end-to-end

---

### 🔷 SEMANA 2-3: Core del Comité (Trabajo Paralelo)

#### 🔧 BACKEND (Días 5-7)
```
DÍA 5: Fase 4.B - Actions Miembros (0.5 día)
DÍA 5-6: Fase 5.B - Dashboard Backend
  ├─ Funciones SQL balance
  ├─ getDashboardComite()
  └─ getTransaccionesRecientes()

DÍA 7: Fase 11.B - Seguridad (0.5 día)
  ├─ Middleware verificación
  └─ Pruebas RLS
```

#### 🎨 FRONTEND (Días 7-9)
```
DÍA 7: Fase 4.F - UI Miembros
  ├─ Página miembros
  └─ Componentes tabla y form

DÍA 8-9: Fase 5.F - Dashboard UI
  ├─ Layout comité
  ├─ Cards de estadísticas
  ├─ Componentes transacciones
  └─ Sidebar específico

DÍA 9: Fase 11.F - Guards (0.5 día)
  └─ HOC withComiteAccess
```

**🔒 Checkpoint Semana 3**: Dashboard y miembros completos

---

### 🔷 SEMANA 3: Transacciones (Trabajo Paralelo)

#### 🔧 BACKEND (Días 8-10)
```
DÍA 8: Fase 6.B - Proyectos Backend (0.5 día)
DÍA 8-9: Fase 7.B - Votos/Pagos Backend
  ├─ registrar_pago_comite()
  ├─ actualizar_estado_voto()
  └─ Actions CRUD votos
```

#### 🎨 FRONTEND (Días 10-12)
```
DÍA 10: Fase 6.F - Proyectos UI
  ├─ Lista proyectos
  ├─ Crear/editar proyecto
  └─ Detalle proyecto

DÍA 11-12: Fase 7.F - Votos/Pagos UI
  ├─ Lista votos
  ├─ Crear voto
  ├─ Detalle voto
  └─ Modal registrar pago
```

**🔒 Checkpoint Semana 3**: Proyectos, votos y pagos funcionando

---

### 🔷 SEMANA 4: Ingresos, Egresos y Reportes (Trabajo Paralelo)

#### 🔧 BACKEND (Días 10-12)
```
DÍA 10: Fase 8.B - Ofrendas Backend (0.5 día)
DÍA 10: Fase 9.B - Gastos Backend (0.5 día)
DÍA 11-12: Fase 10.B - Reportes Backend
  ├─ Funciones SQL reportes
  ├─ getReporteBalance()
  └─ API exportación PDF/Excel

DÍA 12: Fase 12 - Seeds (0.5 día)
```

#### 🎨 FRONTEND (Días 13-16)
```
DÍA 13: Fase 8.F - Ofrendas UI
  ├─ Lista ofrendas
  └─ Crear/editar ofrenda

DÍA 14: Fase 9.F - Gastos UI
  ├─ Lista gastos
  └─ Crear/editar gasto

DÍA 15-16: Fase 10.F - Reportes UI
  ├─ Hook useReportesComite
  ├─ Página reportes
  ├─ Componentes visualización
  └─ UI exportación
```

**🔒 Checkpoint Final**: Sistema completo funcionando

---

## 🔄 Dependencias Críticas Entre Equipos

### ⚠️ FRONTEND BLOQUEADO hasta:

| Frontend Fase | Requiere Backend Completo | Tiempo Espera |
|---------------|---------------------------|---------------|
| 3.F (Comités UI) | ✅ Fase 2 (Tipos) | Día 3 |
| 4.F (Miembros UI) | ✅ Fase 4.B (Actions) | Día 5 |
| 5.F (Dashboard UI) | ✅ Fase 5.B (Backend) | Día 6 |
| 6.F (Proyectos UI) | ✅ Fase 6.B (Backend) | Día 8 |
| 7.F (Votos UI) | ✅ Fase 7.B (Backend) | Día 9 |
| 8.F (Ofrendas UI) | ✅ Fase 8.B (Backend) | Día 10 |
| 9.F (Gastos UI) | ✅ Fase 9.B (Backend) | Día 10 |
| 10.F (Reportes UI) | ✅ Fase 10.B (Backend) | Día 12 |

### 📋 Recomendaciones de Coordinación:

1. **Daily Sync** al final del día para:
   - Backend reporta qué actions están listas
   - Frontend reporta qué necesita siguiente
   - Resolver dudas de contratos/tipos

2. **Commits estructurados**:
   - Backend: `[BE] Fase X.B: Descripción`
   - Frontend: `[FE] Fase X.F: Descripción`

3. **Branches sugeridos**:
   - `feature/backend-comites`
   - `feature/frontend-comites`
   - Merge a `develop` al final de cada fase mayor

---

## 📋 Checklist por Ingeniero

### ✅ BACKEND ENGINEER - Lista de Tareas

#### Semana 1 (Fundamentos)
- [x] **Día 1-2**: Fase 1 - Crear 8 tablas en Supabase ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 1-2**: Configurar políticas RLS para todas las tablas ✅ **32 políticas creadas**
- [x] **Día 1-2**: Crear funciones SQL: `get_balance_comite()`, `actualizar_estado_voto()` ✅ **3 funciones SQL**
- [x] **Día 3**: Fase 2 - Actualizar `database.types.ts` ✅ **Types generados**
- [x] **Día 3**: Crear `src/types/comites.ts` ✅ **348 líneas - COMPLETADO 30 Dic 2025**
- [x] **Día 3**: Crear `src/lib/services/comite-service.ts` ✅ **671 líneas - COMPLETADO 30 Dic 2025**
- [x] **Día 3**: Crear `src/app/actions/comites-actions.ts` ✅ **680 líneas - COMPLETADO 30 Dic 2025**

#### Semana 2 (CRUD y Core)
- [x] **Día 4**: Fase 3.B - Implementar 6 actions de comités (CRUD completo) ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 5**: Fase 4.B - Implementar 4 actions de miembros ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 5-6**: Fase 5.B - Implementar dashboard backend (funciones + actions) ✅ **COMPLETADO 30 Dic 2025**
- [ ] **Día 7**: Fase 11.B - Middleware de verificación de comité 🔄 **PENDIENTE**
- [ ] **Día 7**: Pruebas de seguridad RLS 🔄 **PENDIENTE**

#### Semana 3 (Transacciones)
- [x] **Día 8**: Fase 6.B - Actions CRUD proyectos ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 8-9**: Fase 7.B - Función `registrar_pago_comite()` ✅ **Ya existe en BD**
- [x] **Día 8-9**: Fase 7.B - Actions votos/pagos (5 actions) ✅ **COMPLETADO 30 Dic 2025**

#### Semana 4 (Ingresos/Egresos/Reportes)
- [x] **Día 10**: Fase 8.B - Actions CRUD ofrendas ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 10**: Fase 9.B - Actions CRUD gastos ✅ **COMPLETADO 30 Dic 2025**
- [ ] **Día 11-12**: Fase 10.B - Funciones SQL reportes agregados 🔄 **PENDIENTE**
- [ ] **Día 11-12**: Fase 10.B - API exportación PDF/Excel 🔄 **PENDIENTE**
- [ ] **Día 12**: Fase 12 - Seeds DECOM y Jóvenes 🔄 **PENDIENTE**

**Total estimado**: 10-12 días

---

### ✅ FRONTEND ENGINEER - Lista de Tareas

#### Semana 1 (Espera)
- [ ] **Día 1-3**: ⏳ Esperar Fase 2 completa (tipos disponibles)
- [ ] **Día 3**: Familiarizarse con tipos de comités
- [ ] **Día 3**: Preparar estructura de carpetas `/dashboard/comites`

#### Semana 2 (UI Comités y Dashboard)
- [x] **Día 4**: Fase 3.F - Página lista comités `/dashboard/comites` ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 4**: Componente `ComiteCard.tsx` ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 5**: Fase 3.F - Páginas crear/editar comité ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 5**: Componente `ComiteForm.tsx` ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 6**: Fase 3.F - Página detalle + `AsignarUsuarioModal.tsx` ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 6**: Actualizar Sidebar con menú Comités ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 7**: Fase 4.F - Página miembros del comité ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 7**: Componentes `ComiteMiembroForm.tsx` + `ComiteMiembrosTable.tsx` ✅ **COMPLETADO 30 Dic 2025**

#### Semana 3 (Dashboard y Proyectos)
- [x] **Día 8**: Fase 5.F - Layout comité Dashboard ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 8-9**: Fase 5.F - Dashboard con estadísticas ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 8-9**: Componentes: `BalanceCard`, `TransaccionesRecientes`, `VotosActivosComite` ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 9**: Fase 11.F - HOC `withComiteAccess` y guards ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 10**: Fase 6.F - Páginas proyectos (lista, crear/editar, detalle) ✅ **COMPLETADO 30 Dic 2025 - 5 archivos**

#### Semana 4 (Votos, Transacciones, Reportes)
- [x] **Día 11**: Fase 7.F - Página lista votos del comité ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 11**: Fase 7.F - Página crear voto ✅ **COMPLETADO 30 Dic 2025**
- [x] **Día 12**: Fase 7.F - Página detalle voto + Modal registrar pago ✅ **COMPLETADO 30 Dic 2025 - 7 archivos**
- [x] **Día 13**: Fase 8.F - Páginas ofrendas (lista + crear/editar) ✅ **COMPLETADO 30 Dic 2025 - 3 archivos**
- [x] **Día 14**: Fase 9.F - Páginas gastos (lista + crear/editar) ✅ **COMPLETADO 30 Dic 2025 - 3 archivos**
- [ ] **Día 15**: Fase 10.F - Hook `useReportesComite()`
- [ ] **Día 15-16**: Fase 10.F - Página reportes con visualizaciones
- [ ] **Día 16**: Fase 10.F - UI exportación PDF/Excel

**Total estimado**: 11.5-13.5 días

---

## 📞 Protocolo de Comunicación

### 🔔 Daily Standup (15 min al final del día)

**Backend reporta**:
- ✅ Actions/funciones completadas hoy
- 🚧 En progreso para mañana
- ⚠️ Bloqueos o dudas

**Frontend reporta**:
- ✅ Páginas/componentes completados
- 🚧 En progreso para mañana
- ❓ Qué necesita siguiente del backend

### 📝 Contratos de API (definir juntos)

Antes de cada fase mayor, acordar:
1. **Tipos TypeScript**: Estructura exacta de datos
2. **Actions**: Parámetros de entrada y retorno
3. **Estados de error**: Códigos y mensajes
4. **Validaciones**: Quién valida qué (backend vs frontend)

### 🔀 Estrategia de Branches

```
main
  └── develop
        ├── feature/backend-comites-db (Fase 1-2)
        ├── feature/backend-comites-crud (Fase 3.B-7.B)
        ├── feature/frontend-comites-admin (Fase 3.F-5.F)
        └── feature/frontend-comites-transactions (Fase 6.F-10.F)
```

**Reglas**:
- Backend hace PR a `develop` al terminar cada sub-fase
- Frontend espera merge de backend antes de empezar UI correspondiente
- Testing en `develop` antes de merge a `main`

---

## ⏱️ Timeline Visual

```
SEMANA 1: Fundamentos
Backend:  ████████████████████████ (Fase 1-2)
Frontend: ⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳ (Esperando)

SEMANA 2: CRUD Comités
Backend:  ████░░░░░░░░░░░░░░░░░░░░ (Fase 3.B-5.B)
Frontend: ░░░░████████████████████ (Fase 3.F-5.F)

SEMANA 3: Transacciones
Backend:  ████████░░░░░░░░░░░░░░░░ (Fase 6.B-7.B)
Frontend: ░░░░░░░░████████████████ (Fase 6.F-7.F)

SEMANA 4: Reportes
Backend:  ████████░░░░░░░░░░░░░░░░ (Fase 8.B-12)
Frontend: ░░░░░░░░████████████████ (Fase 8.F-10.F)
```

---

## ⚠️ Dependencias y Consideraciones

1. **Fase 1 es bloqueante**: Todas las demás fases dependen de la BD
2. **Fase 2 antes de UI**: Los tipos deben existir antes de crear componentes
3. **Fase 11 paralela**: Puede desarrollarse junto con otras fases
4. **Testing**: Cada fase debe incluir pruebas básicas

---

## ✅ Criterios de Aceptación

### Funcionalidad Mínima Viable (MVP):
- [ ] Admin puede crear/editar/eliminar comités
- [ ] Admin puede asignar usuarios a comités
- [ ] Tesorero del comité puede acceder SOLO a su comité
- [ ] Tesorero puede gestionar miembros del comité
- [ ] Tesorero puede crear proyectos
- [ ] Tesorero puede crear votos y registrar pagos
- [ ] Tesorero puede registrar ofrendas
- [ ] Tesorero puede registrar gastos
- [ ] Dashboard muestra balance del comité
- [ ] Reportes exportables a PDF

---

## 🔐 Modelo de Permisos Final

| Rol | Ver Comités | Crear Comité | Editar Comité | Ver Dashboard | Gestionar Trans. |
|-----|-------------|--------------|---------------|---------------|------------------|
| Admin | Todos | ✅ | Todos | Todos | Todos |
| Tesorero General | Todos | ✅ | Ninguno | Solo lectura | Ninguno |
| Líder Comité | Solo su comité | ❌ | Su comité | Su comité | Su comité |
| Tesorero Comité | Solo su comité | ❌ | ❌ | Su comité | Su comité |
| Secretario Comité | Solo su comité | ❌ | ❌ | Su comité (lectura) | ❌ |

---

## 📝 Notas Adicionales

1. **Migración de datos**: No hay datos existentes a migrar
2. **Compatibilidad**: El sistema de comités es 100% independiente del sistema general
3. **Futuro**: Se podrá integrar con contabilidad general en una fase posterior

---

**Documento creado**: 30 de Diciembre 2025  
**Autor**: GitHub Copilot  
**Estado**: PENDIENTE DE AUTORIZACIÓN  
**Versión**: 2.0 - División Backend/Frontend

---

# 🎯 RESUMEN EJECUTIVO

## Para el BACKEND Engineer:
- **Inicio**: Inmediato (Fase 1-2, 3 días)
- **Responsabilidad**: Base de datos, servicios, seguridad
- **Entregables clave**: 
  - Día 3: Tipos y actions básicos *(BLOQUEA FRONTEND)*
  - Día 4-12: Actions por módulo según demanda de frontend

## Para el FRONTEND Engineer:
- **Inicio**: Día 3 (después de Fase 2)
- **Responsabilidad**: UI/UX, componentes, páginas
- **Entregables clave**:
  - Día 6: CRUD comités funcionando
  - Día 9: Dashboard del comité
  - Día 16: Sistema completo con reportes

## Tiempo total del proyecto:
- **Backend**: 10-12 días
- **Frontend**: 11.5-13.5 días
- **Total calendario**: ~16-18 días (con trabajo paralelo)

---

# ⏳ ¿AUTORIZA INICIAR CON LA FASE 1?

Por favor responda:
- **"Sí, adelante"** → Backend inicia con las migraciones de base de datos
- **"Modificar X"** → Indique qué cambiar del plan
- **"Tengo dudas"** → Haré las aclaraciones necesarias
