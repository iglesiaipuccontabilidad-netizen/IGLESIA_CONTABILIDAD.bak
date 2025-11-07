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
    - Variables CSS Personalizadas
  variables_css:
    colores_base:
      azul_oscuro: "#152A55"
      azul_medio: "#3D6AB0"
      blanco: "#FFFFFF"
      amarillo: "#F0D447"
      celeste_claro: "#8EB6E4"
      gris_claro: "#DDE5F0"
      verde_success: "#22C55E"
      rojo_warning: "#EF4444"
      gris_texto: "#64748B"
      fondo: "#F8FAFC"
    
    gradientes:
      header: "135deg, var(--azul-oscuro) 0%, var(--azul-medio) 100%"
      progreso: "90deg, var(--verde-success) 0%, var(--celeste-claro) 100%"
      tabla_header: "135deg, var(--azul-oscuro) 0%, var(--azul-medio) 100%"
    
    fondos_transparentes:
      amarillo: "rgba(240, 212, 71, 0.1)"
      azul: "rgba(61, 106, 176, 0.05)"
      celeste: "rgba(142, 182, 228, 0.1)"
      blanco: "rgba(255, 255, 255, 0.1)"
    
    bordes:
      card_left: "4px solid"
      tabla_radius: "8px"
      input_radius: "8px"
      avatar_radius: "50%"
    
    sombras:
      card: "0 2px 12px rgba(21, 42, 85, 0.08)"
      card_hover: "0 4px 20px rgba(21, 42, 85, 0.12)"
      header: "0 2px 10px rgba(21, 42, 85, 0.1)"
    
    dimensiones:
      header_height: "auto"
      logo_size: "50px"
      avatar_size: "35px"
      progress_height: "6px"
      container_max: "1400px"
    
    transiciones:
      hover: "all 0.3s ease"
      transform: "transform 0.2s ease, box-shadow 0.2s ease"
    
    animaciones:
      slideIn: "@keyframes slideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }"
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

## Diseño del Dashboard

### Layout Principal
```yaml
dashboard_layout:
  header:
    estilo:
      fondo: "linear-gradient(135deg, var(--azul-oscuro) 0%, var(--azul-medio) 100%)"
      sombra: "var(--sombra-header)"
      posicion: "sticky"
      top: "0"
      z_index: "100"
      padding: "1rem 2rem"
    
    header_content:
      max_width: "var(--container-max)"
      margin: "0 auto"
      display: "flex"
      justify_content: "space-between"
      align_items: "center"
    
    logo_section:
      display: "flex"
      align_items: "center"
      gap: "1rem"
      logo:
        width: "var(--logo-size)"
        height: "var(--logo-size)"
        background: "var(--blanco)"
        border_radius: "50%"
        display: "flex"
        align_items: "center"
        justify_content: "center"
        font_weight: "bold"
        color: "var(--azul-oscuro)"
        font_size: "1.2rem"
        text: "IPUC"
      titulo:
        color: "var(--blanco)"
        font_size: "1.5rem"
        font_weight: "600"
    
    user_menu:
      display: "flex"
      align_items: "center"
      gap: "1rem"
      color: "var(--blanco)"
      info:
        text_align: "right"
        nombre:
          font_weight: "600"
          margin_bottom: "0.2rem"
        rol:
          font_size: "0.8rem"
          opacity: "0.8"
      dropdown:
        background: "var(--fondo-blanco-transparente)"
        border: "1px solid rgba(255, 255, 255, 0.2)"
        padding: "0.5rem 1rem"
        border_radius: "8px"
        hover:
          background: "rgba(255, 255, 255, 0.2)"

  contenedor_principal:
    max_width: "var(--container-max)"
    margin: "0 auto"
    padding: "2rem"
    background: "var(--fondo)"
    
  kpis_section:
    display: "grid"
    grid_template: "repeat(auto-fit, minmax(280px, 1fr))"
    gap: "1.5rem"
    margin_bottom: "2rem"
    animation: "slideIn 0.6s ease-out"

  tarjetas_estadisticas:
    kpi_card:
      estilo_base:
        background: "var(--blanco)"
        border_radius: "12px"
        padding: "1.5rem"
        box_shadow: "var(--sombra-card)"
        border_left: "var(--borde-card-left)"
        transition: "var(--transition-transform)"
        animation: "slideIn 0.6s ease-out"
      hover:
        transform: "translateY(-2px)"
        box_shadow: "var(--sombra-card-hover)"
      variantes:
        total_comprometido:
          border_color: "var(--azul-medio)"
          icon_bg: "rgba(61, 106, 176, 0.1)"
          icon_color: "var(--azul-medio)"
        total_recaudado:
          border_color: "var(--verde-success)"
          icon_bg: "rgba(34, 197, 94, 0.1)"
          icon_color: "var(--verde-success)"
        total_pendiente:
          border_color: "var(--amarillo)"
          icon_bg: "rgba(240, 212, 71, 0.1)"
          icon_color: "#B45309"
        votos_activos:
          border_color: "var(--celeste-claro)"
          icon_bg: "rgba(142, 182, 228, 0.1)"
          icon_color: "var(--celeste-claro)"
      
      componentes:
        header:
          display: "flex"
          justify_content: "space-between"
          align_items: "center"
          margin_bottom: "1rem"
        titulo:
          font_size: "0.9rem"
          font_weight: "600"
          color: "var(--gris-texto)"
          text_transform: "uppercase"
          letter_spacing: "0.5px"
        icono:
          width: "40px"
          height: "40px"
          border_radius: "8px"
          display: "flex"
          align_items: "center"
          justify_content: "center"
          font_size: "1.2rem"
        valor:
          font_size: "2rem"
          font_weight: "700"
          color: "var(--azul-oscuro)"
          margin_bottom: "0.5rem"
        tendencia:
          font_size: "0.8rem"
          color: "var(--verde-success)"
    
    content_section:
      display: "grid"
      grid_template_columns: "70% 30%"
      gap: "2rem"
      
      panel_votos:
        background: "var(--blanco)"
        border_radius: "12px"
        padding: "1.5rem"
        box_shadow: "var(--sombra-card)"
        animation: "slideIn 0.6s ease-out"
        
        header:
          display: "flex"
          justify_content: "space-between"
          align_items: "center"
          margin_bottom: "1.5rem"
          padding_bottom: "1rem"
          border_bottom: "2px solid var(--gris-claro)"
          
        filtros:
          display: "flex"
          gap: "1rem"
          margin_bottom: "1.5rem"
          flex_wrap: "wrap"
          inputs:
            padding: "0.7rem 1rem"
            border: "2px solid var(--gris-claro)"
            border_radius: "var(--input-radius)"
            font_size: "0.9rem"
            transition: "border-color 0.3s ease"
            focus:
              outline: "none"
              border_color: "var(--azul-medio)"
        
        tabla:
          width: "100%"
          border_collapse: "collapse"
          thead:
            background: "var(--gradiente-tabla-header)"
            color: "var(--blanco)"
            th:
              padding: "1rem 0.8rem"
              text_align: "left"
              font_weight: "600"
              font_size: "0.9rem"
              first_child:
                border_radius: "8px 0 0 0"
              last_child:
                border_radius: "0 8px 0 0"
          tbody:
            tr:
              hover:
                background: "var(--fondo-azul-transparente)"
            td:
              padding: "1rem 0.8rem"
              border_bottom: "1px solid var(--gris-claro)"
              vertical_align: "middle"
          
          miembro_info:
            display: "flex"
            align_items: "center"
            gap: "0.8rem"
            avatar:
              width: "var(--avatar-size)"
              height: "var(--avatar-size)"
              border_radius: "var(--avatar-radius)"
              background: "var(--celeste-claro)"
              color: "var(--blanco)"
              display: "flex"
              align_items: "center"
              justify_content: "center"
              font_weight: "600"
              font_size: "0.9rem"
            detalles:
              nombre:
                font_weight: "600"
                color: "var(--azul-oscuro)"
                margin_bottom: "0.2rem"
              cedula:
                font_size: "0.8rem"
                color: "var(--gris-texto)"
          
          proposito_tag:
            background: "var(--amarillo)"
            color: "var(--azul-oscuro)"
            padding: "0.3rem 0.8rem"
            border_radius: "20px"
            font_size: "0.8rem"
            font_weight: "600"
          
          progress_container:
            display: "flex"
            align_items: "center"
            gap: "0.8rem"
            barra:
              flex: "1"
              height: "var(--progress-height)"
              background: "var(--gris-claro)"
              border_radius: "3px"
              overflow: "hidden"
              fill:
                height: "100%"
                background: "var(--gradiente-progreso)"
                transition: "width 0.3s ease"
            texto:
              font_weight: "600"
              font_size: "0.9rem"
              color: "var(--azul-oscuro)"
              min_width: "40px"
      
      panel_lateral:
        seguimiento:
          top_deudores:
            item:
              fondo: "rgba(240, 212, 71, 0.1)"
              borde: "3px amarillo"
              info:
                nombre: "600 weight"
                monto: "rojo-warning"
          alertas:
            estilo: "lista con iconos"
            separacion: "bordes gris-claro"

  responsive:
    breakpoints:
      desktop:
        min_width: "1200px"
        content_section:
          grid_template_columns: "70% 30%"
      
      tablet:
        max_width: "1200px"
        content_section:
          grid_template_columns: "1fr"
      
      mobile:
        max_width: "768px"
        ajustes:
          main_container:
            padding: "1rem"
          
          header_content:
            flex_direction: "column"
            gap: "1rem"
          
          filtros:
            flex_direction: "column"
            filter_input:
              min_width: "auto"
          
          tabla_container:
            font_size: "0.8rem"
          
          kpi_value:
            font_size: "1.5rem"
    
    notas_responsive:
      - "Diseño fluido que se adapta a diferentes tamaños de pantalla"
      - "Grid responsivo para KPIs que ajusta automáticamente el número de columnas"
      - "Menú de usuario colapsable en móvil"
      - "Filtros apilados en vista móvil para mejor usabilidad"
      - "Tabla con scroll horizontal en móvil"
      - "Tamaños de fuente reducidos en móvil para mejor legibilidad"
      - "Panel de seguimiento se mueve debajo de la tabla en tablet y móvil"
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
    - Sidebar: "Navegación lateral con gradiente personalizado"
    - DashboardHeader: "Encabezado del dashboard"
  
  miembros:
    - MemberList: "Lista de miembros"
    - MemberCard: "Tarjeta de miembro con estilo IPUC"
    - MiembroCombobox: "Selector de miembros"
  
  dashboard:
    - DashboardCards: "Tarjetas de estadísticas principales"
    - VotosActivosPanel: "Panel principal de votos activos con progreso visual"
    - VotosActivosTable: "Tabla compacta de votos activos"
  
  votos:
    - VotoCard: "Tarjeta de voto con barra de progreso y estadísticas"
    - VotoInfo: "Información detallada del voto"
    - VotoProgress: "Componente de progreso con gradiente"
  
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