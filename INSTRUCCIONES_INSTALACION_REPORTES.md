# 📦 Instrucciones de Instalación - Módulo de Reportes

## Dependencias Requeridas

Para que el módulo de reportes funcione completamente, necesitas instalar las siguientes dependencias:

### FASE 3 - Generación de PDF

```bash
npm install jspdf jspdf-autotable
```

**O con yarn:**
```bash
yarn add jspdf jspdf-autotable
```

### FASE 4 - Exportación a Excel

```bash
npm install xlsx file-saver
```

**O con yarn:**
```bash
yarn add xlsx file-saver
```

### Tipos de TypeScript (opcional pero recomendado)

```bash
npm install --save-dev @types/file-saver
```

---

## Instalación Completa

Si prefieres instalar todo de una vez:

```bash
npm install jspdf jspdf-autotable xlsx file-saver
npm install --save-dev @types/file-saver
```

---

## Solución de Problemas

### Error de permisos en Windows/WSL

Si encuentras errores de permisos al instalar (como `EISDIR` o `EPERM`), intenta:

1. **Ejecutar desde WSL (no desde Windows)**:
   ```bash
   cd /home/juanda/ipuc-contabilidad
   npm install jspdf jspdf-autotable xlsx file-saver
   ```

2. **Limpiar caché de npm**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   npm install jspdf jspdf-autotable xlsx file-saver
   ```

3. **Usar yarn en lugar de npm**:
   ```bash
   yarn add jspdf jspdf-autotable xlsx file-saver
   ```

---

## Verificación

Después de instalar, verifica que las dependencias estén en tu `package.json`:

```json
{
  "dependencies": {
    "jspdf": "^2.x.x",
    "jspdf-autotable": "^3.x.x",
    "xlsx": "^0.18.x",
    "file-saver": "^2.x.x"
  }
}
```

---

## Uso

Una vez instaladas las dependencias, el módulo de reportes estará completamente funcional:

1. **Navega a** `/dashboard/reportes`
2. **Selecciona** el tipo de reporte
3. **Aplica filtros** según necesites
4. **Exporta** a PDF o Excel

---

## Características Implementadas

✅ **FASE 1**: Estructura base del módulo
✅ **FASE 2**: Consultas y filtros dinámicos
✅ **FASE 3**: Generación de PDF (requiere instalación)
⏳ **FASE 4**: Exportación a Excel (requiere instalación)
⏳ **FASE 5**: Panel de métricas y gráficos

---

## Soporte

Si encuentras problemas, revisa:
- Versión de Node.js: >= 18.x
- Versión de npm: >= 9.x
- Permisos de escritura en la carpeta del proyecto
