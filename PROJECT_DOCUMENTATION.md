# Documentación del Proyecto IPUC Contabilidad

## Metadata del Proyecto
- **Nombre**: IPUC Contabilidad
- **Tipo**: Aplicación Web
- **Framework**: Next.js
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estilado**: Tailwind CSS + CSS Modules

## Estructura del Proyecto

### Tecnologías Principales
```yaml
tecnologias:
  framework: Next.js
  version: 14.x
  lenguaje: TypeScript
  base_de_datos: Supabase/PostgreSQL
  autenticacion: Supabase Auth
  estilado: 
    - Tailwind CSS
    - CSS Modules
  estado:
    - React Context (AuthContext)
  hosting: Vercel
```

### Estructura de Directorios
```yaml
directorios:
  src/:
    app/:
      - Rutas y páginas de la aplicación (App Router de Next.js)
      - Estructura basada en el sistema de archivos
    components/:
      - Componentes reutilizables
      - Organizados por funcionalidad
    lib/:
      - Utilidades y configuraciones
      - Tipos de base de datos
      - Cliente de Supabase
    styles/:
      - Módulos CSS
      - Estilos globales
    types/:
      - Definiciones de tipos TypeScript
    utils/:
      - Funciones de utilidad
```

## Modelo de Datos

### Tablas Principales
```yaml
tablas:
  usuarios:
    descripcion: "Almacena usuarios administradores del sistema"
    campos:
      id: "uuid (PK)"
      email: "text"
      rol: "text (admin)"
      estado: "text (activo/inactivo)"
      created_at: "timestamp"
      updated_at: "timestamp"

  miembros:
    descripcion: "Almacena información de los miembros de la iglesia"
    campos:
      id: "uuid (PK)"
      nombres: "text"
      apellidos: "text"
      cedula: "text (unique)"
      telefono: "text"
      email: "text (unique)"
      direccion: "text"
      rol: "text (admin/usuario/pendiente)"
      estado: "text (activo/inactivo)"
      created_at: "timestamp"
      updated_at: "timestamp"
      fecha_ingreso: "date"

  votos:
    descripcion: "Registro de votos/compromisos financieros"
    campos:
      id: "uuid (PK)"
      miembro_id: "uuid (FK -> miembros.id)"
      proposito: "text"
      monto_total: "numeric"
      recaudado: "numeric"
      fecha_limite: "date"
      estado: "text (activo/completado/cancelado)"
      created_at: "timestamp"
      updated_at: "timestamp"
      creado_por: "uuid (FK -> auth.users.id)"
      ultima_actualizacion_por: "uuid (FK -> auth.users.id)"

  pagos:
    descripcion: "Registro de pagos realizados para los votos"
    campos:
      id: "uuid (PK)"
      voto_id: "uuid (FK -> votos.id)"
      monto: "numeric"
      fecha_pago: "date"
      nota: "text"
      registrado_por: "uuid (FK -> miembros.id)"
      created_at: "timestamp"
      metodo_pago: "text"
```

## Funcionalidades Principales

### Gestión de Usuarios
```yaml
usuarios:
  acceso:
    descripcion: "Sistema simplificado de acceso único"
    caracteristicas:
      - "Todos los usuarios tienen acceso completo al sistema"
      - "No hay roles diferenciados"
      - "Autenticación simple por email/password"
      - "Acceso directo después del login exitoso"

  funcionalidades:
    - Registro de nuevos usuarios con email/password
    - Inicio de sesión directo
    - Acceso a todas las funcionalidades del sistema
```

### Gestión de Miembros
```yaml
miembros:
  funcionalidades:
    - Registro de nuevos miembros
    - Actualización de información personal
    - Visualización de historial de votos
    - Gestión de estado (activo/inactivo)
  acciones:
    - Crear miembro
    - Editar miembro
    - Desactivar miembro
    - Ver historial de votos
```

### Gestión de Votos
```yaml
votos:
  funcionalidades:
    - Creación de nuevos votos
    - Seguimiento de pagos
    - Actualización de estado
    - Visualización de progreso
  estados:
    activo: "Voto en curso con pagos pendientes"
    completado: "Voto con monto total recaudado"
    cancelado: "Voto cancelado antes de completarse"
  acciones:
    - Crear voto
    - Registrar pago
    - Ver historial de pagos
    - Actualizar estado
```

### Gestión de Pagos
```yaml
pagos:
  funcionalidades:
    - Registro de pagos para votos
    - Historial de pagos
    - Diferentes métodos de pago
  metodos_pago:
    - efectivo
    - transferencia
    - otro
  acciones:
    - Registrar pago
    - Ver historial
    - Generar reportes
```

## Rutas de la Aplicación
```yaml
rutas:
  auth:
    /login: "Página de inicio de sesión"
    /registro: "Registro de nuevos usuarios"
  dashboard:
    /: "Panel principal con estadísticas"
    /miembros:
      /: "Lista de miembros"
      /nuevo: "Registro de nuevo miembro"
      /[id]: "Detalles del miembro"
    /votos:
      /: "Lista de votos"
      /nuevo: "Crear nuevo voto"
      /[id]: 
        /: "Detalles del voto"
        /pago: "Registrar pago para el voto"
    /pagos:
      /: "Historial general de pagos"
      /[id]: "Registro de pago específico"
    /admin:
      /usuarios: "Gestión de usuarios del sistema"
```

## Seguridad y Permisos
```yaml
seguridad:
  autenticacion:
    proveedor: "Supabase Auth"
    metodo: "Email/Password"
    notas:
      - "Sistema simplificado usando solo autenticación por email/password"
      - "No se requiere confirmación de email"
      - "No se utilizan magic links u otros métodos de autenticación"
  
  row_level_security:
    usuarios:
      - "Solo administradores pueden ver y modificar"
    miembros:
      - "Usuarios autenticados pueden ver"
      - "Administradores pueden modificar"
    votos:
      - "Usuarios pueden ver sus propios votos"
      - "Administradores pueden ver todos"
    pagos:
      - "Usuarios pueden ver pagos de sus votos"
      - "Administradores pueden ver todos"
```

## Flujos de Trabajo Principales

### Registro de Nuevo Miembro
```yaml
flujo_nuevo_miembro:
  1: "Administrador accede a /dashboard/miembros/nuevo"
  2: "Completa formulario con datos del miembro"
  3: "Sistema valida datos únicos (cédula, email)"
  4: "Se crea registro en tabla miembros"
  5: "Redirección a lista de miembros"
```

### Registro de Nuevo Voto
```yaml
flujo_nuevo_voto:
  1: "Usuario accede a /dashboard/votos/nuevo"
  2: "Selecciona miembro"
  3: "Ingresa detalles del voto"
  4: "Sistema crea registro en tabla votos"
  5: "Redirección a detalles del voto"
```

### Registro de Pago
```yaml
flujo_registro_pago:
  1: "Usuario accede a detalles del voto"
  2: "Selecciona 'Registrar Pago'"
  3: "Ingresa monto y detalles del pago"
  4: "Sistema valida monto contra saldo pendiente"
  5: "Crea registro en tabla pagos"
  6: "Actualiza monto recaudado en voto"
  7: "Actualiza estado si se completó el pago total"
```

## Componentes Principales
```yaml
componentes:
  autenticacion:
    - AuthContext: "Contexto global de autenticación"
    - ProtectedRoute: "HOC para proteger rutas"
  
  layout:
    - Layout: "Layout principal de la aplicación"
    - Sidebar: "Navegación lateral"
    - DashboardHeader: "Encabezado del dashboard"
  
  miembros:
    - MemberList: "Lista de miembros"
    - MemberCard: "Tarjeta de miembro"
    - MiembroCombobox: "Selector de miembros"
  
  votos:
    - VotosActivosTable: "Tabla de votos activos"
    - VotoCard: "Tarjeta de voto"
    - VotoInfo: "Información detallada del voto"
  
  pagos:
    - PagoForm: "Formulario de registro de pago"
    - HistorialPagos: "Historial de pagos"
    - PagoPageContent: "Contenido de página de pago"
```

## Utilidades y Helpers
```yaml
utilidades:
  format.ts:
    - "formatCurrency: Formato de moneda (COP)"
    - "formatDate: Formato de fechas"
    - "formatPercent: Formato de porcentajes"
  
  supabase/:
    - "client.ts: Cliente de Supabase"
    - "server.ts: Cliente para Server Components"
    - "actions.ts: Server Actions"
```

## Variables de Entorno
```yaml
env_vars:
  vercel_required:
    NEXT_PUBLIC_SUPABASE_URL:
      descripcion: "URL del proyecto Supabase"
      ejemplo: "https://tu-proyecto.supabase.co"
      donde_obtener: "Dashboard de Supabase > Settings > API"
      obligatorio: true

    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      descripcion: "Clave anónima para autenticación pública"
      ejemplo: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      donde_obtener: "Dashboard de Supabase > Settings > API > Project API keys > anon public"
      obligatorio: true

    SUPABASE_SERVICE_ROLE_KEY:
      descripcion: "Clave de servicio para operaciones privilegiadas"
      ejemplo: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      donde_obtener: "Dashboard de Supabase > Settings > API > Project API keys > service_role"
      obligatorio: true
      advertencia: "¡Mantener segura! Tiene acceso completo a la base de datos"

    NEXT_PUBLIC_SITE_URL:
      descripcion: "URL base de la aplicación"
      ejemplo: "https://tu-dominio.com"
      donde_obtener: "Tu dominio personalizado o URL de Vercel"
      obligatorio: true
      production_value: "https://ipuc-contabilidad.vercel.app"
      development_value: "http://localhost:3000"

  pasos_configuracion:
    1: "Ir al dashboard de Vercel"
    2: "Seleccionar el proyecto"
    3: "Ir a Settings > Environment Variables"
    4: "Agregar cada variable con su valor correspondiente"
    5: "Asegurarse de seleccionar los entornos correctos (Production/Preview/Development)"

  notas_importantes:
    - "Las variables NEXT_PUBLIC_* estarán disponibles en el cliente"
    - "Mantener SUPABASE_SERVICE_ROLE_KEY segura y nunca exponerla al cliente"
    - "Usar valores diferentes para desarrollo y producción"
    - "Verificar que las variables estén correctamente configuradas antes del despliegue"
```

## Scripts y Comandos
```yaml
scripts:
  dev: "Inicia servidor de desarrollo"
  build: "Construye la aplicación"
  start: "Inicia la aplicación construida"
  lint: "Ejecuta el linter"
  type-check: "Verifica tipos de TypeScript"
```

## Consideraciones de Despliegue
```yaml
deployment:
  platform: "Vercel"
  requirements:
    - "Node.js >= 18.x"
    - "Variables de entorno configuradas"
    - "Supabase project configurado"
  pasos:
    1: "Configurar variables de entorno"
    2: "Conectar con repositorio"
    3: "Configurar dominio personalizado"
    4: "Verificar políticas RLS en Supabase"
```

## Mantenimiento y Escalabilidad
```yaml
mantenimiento:
  tareas_periodicas:
    - "Backup de base de datos"
    - "Revisión de logs de errores"
    - "Actualización de dependencias"
  
  monitorizacion:
    - "Errores de autenticación"
    - "Rendimiento de consultas"
    - "Uso de almacenamiento"
```

---

*Nota: Esta documentación está diseñada para ser leída tanto por humanos como por IAs, siguiendo un formato estructurado en YAML para facilitar su procesamiento automático.*