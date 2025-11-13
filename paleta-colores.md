# Paleta de Colores del Proyecto IPUC Contabilidad

## Introducción

Este documento organiza y documenta la paleta de colores utilizada en el proyecto IPUC Contabilidad. Se estructura por fuentes de colores para facilitar la referencia y el mantenimiento, agrupando los colores por categorías funcionales. Cada color incluye su nombre, valor hexadecimal y una breve descripción cuando está disponible.

## Design Tokens

Los Design Tokens representan los colores base definidos en el sistema de diseño, organizados por categorías.

### Primarios
- **Primary-500**: `#2563eb` - Azul Real, color principal de la marca
- **Primary-600**: `#1d4ed8` - Azul Profundo, variante más oscura del principal
- **Primary-700**: `#1e40af` - Azul Oscuro, para elementos destacados
- **Primary-400**: `#3b82f6` - Azul Brillante, variante más clara
- **Primary-50**: `#eff6ff` - Azul Muy Claro, usado para fondos
- **Primary-100**: `#dbeafe` - Azul Muy Claro, usado para bordes

### Acentos
- **Cyan-500**: `#06b6d4` - Cyan Principal, acento secundario
- **Cyan-400**: `#22d3ee` - Cyan Claro, variante clara del acento
- **Cyan-600**: `#0891b2` - Cyan Oscuro, variante oscura del acento
- **Cyan-50**: `#ecfeff` - Cyan Muy Claro, usado para fondos

### Neutros
- **Slate-900**: `#0f172a` - Texto Principal, color de texto principal
- **Slate-700**: `#334155` - Texto Secundario, para textos secundarios
- **Slate-600**: `#475569` - Texto Terciario, para textos terciarios
- **Slate-500**: `#64748b` - Texto Deshabilitado, para elementos deshabilitados
- **Slate-200**: `#e2e8f0` - Bordes, color para bordes
- **Slate-100**: `#f1f5f9` - Fondo Alternativo, fondo secundario
- **Slate-50**: `#f8fafc` - Fondo Principal, fondo base

### Estados
- **Emerald-500**: `#10b981` - Verde Principal, indica éxito
- **Emerald-50**: `#ecfdf5` - Verde Muy Claro, fondo para estados de éxito
- **Emerald-100**: `#d1fae5` - Verde Muy Claro, bordes para estados de éxito
- **Amber-500**: `#f59e0b` - Ámbar Principal, indica advertencia
- **Amber-50**: `#fffbeb` - Ámbar Muy Claro, fondo para advertencias
- **Amber-100**: `#fef3c7` - Ámbar Muy Claro, bordes para advertencias
- **Rose-500**: `#f43f5e` - Rojo Principal, indica error
- **Rose-50**: `#fff1f2` - Rojo Muy Claro, fondo para errores
- **Rose-100**: `#ffe4e6` - Rojo Muy Claro, bordes para errores

## Variables CSS

Esta sección incluye las variables CSS definidas en el archivo de estilos, organizadas por categorías.

### Primarios
- `--azul-oscuro`: `#1a365d` - Azul oscuro para elementos principales
- `--azul-medio`: `#2c5282` - Azul medio, variante intermedia
- `--azul-claro`: `#4299e1` - Azul claro, variante clara

### Neutros
- `--blanco`: `#ffffff` - Blanco puro
- `--negro`: `#000000` - Negro puro
- `--gris-claro`: `#f7fafc` - Gris claro para fondos
- `--gris-medio`: `#e2e8f0` - Gris medio para bordes
- `--gris-oscuro`: `#2d3748` - Gris oscuro para textos

### Estados
- `--color-success`: `#059669` - Verde para estados de éxito
- `--color-error`: `#dc2626` - Rojo para estados de error
- `--color-warning`: `#d97706` - Amarillo para advertencias
- `--color-info`: `#2563eb` - Azul para información

## Variables CSS Globales

Las variables CSS globales definidas en el selector `:root`, incluyendo modos de color.

### Fondos
- `--color-bg`: `var(--blanco)` - Color de fondo principal
- `--color-bg-secondary`: `var(--gris-claro)` - Color de fondo secundario
- `--color-page-bg`: `var(--gris-claro)` - Color de fondo de página

### Textos
- `--color-text-primary`: `var(--gris-oscuro)` - Color de texto principal
- `--color-text-secondary`: `#4a5568` - Color de texto secundario

### Bordes
- `--color-border`: `var(--gris-medio)` - Color de borde estándar
- `--color-border-focus`: `var(--azul-claro)` - Color de borde en foco

### Modo Oscuro
- `--color-primary`: `#3b82f6` - Color primario en modo oscuro
- `--color-primary-dark`: `#2563eb` - Variante oscura del primario
- `--color-secondary`: `#6366f1` - Color secundario en modo oscuro
- `--color-secondary-dark`: `#4f46e5` - Variante oscura del secundario
- `--color-text-primary`: `#f3f4f6` - Texto principal en modo oscuro
- `--color-text-secondary`: `#9ca3af` - Texto secundario en modo oscuro
- `--color-bg`: `#111827` - Fondo en modo oscuro
- `--color-bg-hover`: `#1f2937` - Fondo en hover en modo oscuro
- `--color-card-bg`: `#1f2937` - Fondo de tarjetas en modo oscuro
- `--color-page-bg`: `#111827` - Fondo de página en modo oscuro
- `--color-border`: `#374151` - Bordes en modo oscuro
- `--color-border-hover`: `#4b5563` - Bordes en hover en modo oscuro
- `--color-success`: `#10b981` - Éxito en modo oscuro
- `--color-error`: `#ef4444` - Error en modo oscuro
- `--color-warning`: `#f59e0b` - Advertencia en modo oscuro
- `--color-info`: `#3b82f6` - Información en modo oscuro

## Resumen y Notas Adicionales

Esta paleta de colores está diseñada para proporcionar consistencia visual en toda la aplicación IPUC Contabilidad. Los Design Tokens sirven como base para el sistema de diseño, mientras que las Variables CSS facilitan la implementación técnica.

**Notas importantes:**
- Mantener un contraste adecuado para accesibilidad (nivel AA mínimo).
- Usar gradientes con moderación, principalmente para elementos destacados.
- Las variables CSS globales incluyen soporte para modo oscuro automático.
- Para nuevos colores, seguir la nomenclatura existente y agregar a las categorías apropiadas.