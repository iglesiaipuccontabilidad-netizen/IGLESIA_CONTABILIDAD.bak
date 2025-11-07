# Paleta de Colores IPUC Contabilidad 🎨

## Colores Principales

### Azul Principal
- **Primary-500:** `#2563eb` (Azul Real)
- **Primary-600:** `#1d4ed8` (Azul Profundo)
- **Primary-700:** `#1e40af` (Azul Oscuro)
- **Primary-400:** `#3b82f6` (Azul Brillante)
- **Primary-50:** `#eff6ff` (Azul Muy Claro - Fondo)
- **Primary-100:** `#dbeafe` (Azul Muy Claro - Bordes)

## Colores de Acento

### Cyan (Acento Secundario)
- **Cyan-500:** `#06b6d4` (Cyan Principal)
- **Cyan-400:** `#22d3ee` (Cyan Claro)
- **Cyan-600:** `#0891b2` (Cyan Oscuro)
- **Cyan-50:** `#ecfeff` (Cyan Muy Claro - Fondo)

### Slate (Neutros)
- **Slate-900:** `#0f172a` (Texto Principal)
- **Slate-700:** `#334155` (Texto Secundario)
- **Slate-600:** `#475569` (Texto Terciario)
- **Slate-500:** `#64748b` (Texto Deshabilitado)
- **Slate-200:** `#e2e8f0` (Bordes)
- **Slate-100:** `#f1f5f9` (Fondo Alternativo)
- **Slate-50:** `#f8fafc` (Fondo Principal)

## Colores de Estado

### Éxito
- **Emerald-500:** `#10b981` (Verde Principal)
- **Emerald-50:** `#ecfdf5` (Verde Muy Claro - Fondo)
- **Emerald-100:** `#d1fae5` (Verde Muy Claro - Bordes)

### Advertencia
- **Amber-500:** `#f59e0b` (Ámbar Principal)
- **Amber-50:** `#fffbeb` (Ámbar Muy Claro - Fondo)
- **Amber-100:** `#fef3c7` (Ámbar Muy Claro - Bordes)

### Error
- **Rose-500:** `#f43f5e` (Rojo Principal)
- **Rose-50:** `#fff1f2` (Rojo Muy Claro - Fondo)
- **Rose-100:** `#ffe4e6` (Rojo Muy Claro - Bordes)

## Gradientes

### Principal
```css
background-image: linear-gradient(to right, #2563eb, #1d4ed8, #06b6d4);
/* from-primary-500 via-primary-600 to-cyan-500 */
```

### Alternativo
```css
background-image: linear-gradient(to bottom right, #eff6ff, #f8fafc, #ecfeff);
/* from-primary-50 via-slate-50 to-cyan-50 */
```

## Uso de Colores

### Botones
- **Principal:** Gradiente azul a cyan
- **Secundario:** Slate-100 con texto en Slate-600
- **Deshabilitado:** Opacidad reducida al 60%

### Texto
- **Principal:** Slate-900
- **Secundario:** Slate-600
- **Deshabilitado:** Slate-500
- **Sobre fondos oscuros:** white

### Fondos
- **Principal:** white o Slate-50
- **Secundario:** Slate-100
- **Gradiente suave:** Gradiente alternativo

### Bordes
- **Principal:** Slate-200
- **Enfoque:** Primary-500
- **Estado hover:** Slate-300

### Iconos
- **Principal:** Mismo color que el texto asociado
- **Acento:** Primary-500 o Cyan-500
- **Deshabilitado:** Slate-400

## Consejos de Implementación

1. **Consistencia:** Usar las variables CSS definidas para mantener consistencia
2. **Accesibilidad:** Asegurar suficiente contraste (AA)
3. **Estados:** Usar variaciones más claras/oscuras para hover/active
4. **Feedback:** Usar colores de estado para comunicar resultados
5. **Degradados:** Usar con moderación para elementos destacados