# 🔧 Solución al Error ChunkLoadError

## ❌ Error
```
Runtime ChunkLoadError
Loading chunk 954 failed.
(error: http://localhost:3000/_next/static/chunks/954.js)
```

## 🎯 Causa
Este error ocurre cuando:
1. Se hacen cambios en el código mientras el servidor está corriendo
2. El navegador intenta cargar chunks antiguos que ya no existen
3. Hay archivos corruptos en la carpeta `.next`

## ✅ Solución

### Opción 1: Recarga Completa del Navegador (Rápido)
1. Presiona `Ctrl + Shift + R` (Windows/Linux) o `Cmd + Shift + R` (Mac)
2. Esto hace un hard refresh y limpia el caché del navegador

### Opción 2: Limpiar y Reconstruir (Recomendado)

**En WSL (Ubuntu):**
```bash
cd /home/juanda/ipuc-contabilidad

# Detener el servidor (Ctrl+C)

# Limpiar caché
rm -rf .next
rm -rf node_modules/.cache

# Reconstruir
npm run dev
```

### Opción 3: Si el problema persiste

```bash
cd /home/juanda/ipuc-contabilidad

# Limpiar todo
rm -rf .next
rm -rf node_modules/.cache
rm -rf out

# Reinstalar dependencias
npm install

# Iniciar servidor
npm run dev
```

## 🚀 Prevención

Para evitar este error en el futuro:

1. **Siempre recarga el navegador** después de hacer cambios importantes
2. **Usa Hard Refresh** (`Ctrl + Shift + R`) cuando veas errores extraños
3. **Limpia `.next`** periódicamente si trabajas con muchos cambios

## 📝 Comando Rápido

Crea un script en `package.json`:

```json
{
  "scripts": {
    "clean": "rm -rf .next && rm -rf node_modules/.cache",
    "dev:clean": "npm run clean && npm run dev"
  }
}
```

Luego ejecuta:
```bash
npm run dev:clean
```

---

**Solución inmediata:** Presiona `Ctrl + Shift + R` en tu navegador para hacer un hard refresh.
