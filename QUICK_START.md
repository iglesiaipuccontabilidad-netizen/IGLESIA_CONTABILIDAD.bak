# 🎯 Guía Rápida de Deployment

## ⚡ Deployment en 5 Pasos

### 1️⃣ **Generar CRON_SECRET**

Tu CRON_SECRET ha sido generado. **Guárdalo en un lugar seguro:**

```
8IOMycKjesNIS6L3Ari5kWSTtIoYITTh7UPMHd3uxjE=
```

⚠️ **IMPORTANTE:** Este secret solo se muestra una vez. Cópialo ahora.

### 2️⃣ **Autenticar y Link**

```bash
# Autenticar con Supabase
npx supabase login

# Linkear al proyecto
npx supabase link
```

### 3️⃣ **Desplegar** 

```bash
# Opción fácil: usar el script
./scripts/deploy-edge-function.sh

# O manualmente:
npx supabase functions deploy actualizar-votos-vencidos --no-verify-jwt
```

### 4️⃣ **Configurar CRON_SECRET**

```bash
# Usar el secret generado en el paso 1
npx supabase secrets set CRON_SECRET="<pega_aquí_el_secret>"

# Verificar
npx supabase secrets list
```

### 5️⃣ **Configurar GitHub Secrets**

Ve a: **Settings > Secrets and variables > Actions**

Agrega estos 2 secrets:

| Nombre | Valor |
|--------|-------|
| `CRON_SECRET` | El secret del paso 1 |
| `SUPABASE_PROJECT_REF` | Tu project ID (ej: abc123xyz) |

---

## ✅ Probar

```bash
# Probar la función
./scripts/test-edge-function.sh

# O manualmente
curl -X POST \
  'https://[PROJECT_REF].supabase.co/functions/v1/actualizar-votos-vencidos' \
  -H "Authorization: Bearer [CRON_SECRET]" \
  -H 'Content-Type: application/json'
```

---

## 📚 Documentación Completa

Para más detalles, consulta: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🆘 ¿Problemas?

**Error 401?** → Verifica CRON_SECRET  
**Error 500?** → Revisa logs en Dashboard  
**GitHub Action falla?** → Verifica secrets en GitHub  

**Logs:**
- Supabase: Dashboard > Edge Functions > Logs
- GitHub: Actions > Actualizar Votos Vencidos
