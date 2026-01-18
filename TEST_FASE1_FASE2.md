# 🧪 GUÍA DE PRUEBAS - FASE 1 Y FASE 2

## ✅ Checklist de Verificación

### FASE 1: Soluciones Críticas

#### ✓ Test 1: Caché de Rol en Cookies
**Objetivo:** Verificar que el rol se guarda y lee de cookies correctamente

**Pasos:**
1. Abrir DevTools → Application → Cookies
2. Limpiar todas las cookies del sitio
3. Hacer login con credenciales válidas
4. ✅ **VERIFICAR:** Cookies `user_rol` y `user_estado` creadas
5. Recargar la página (F5)
6. ✅ **VERIFICAR:** En Console ver: "✅ [AuthContext] Rol obtenido de cookie (INSTANTÁNEO)"
7. Abrir en nueva pestaña
8. ✅ **VERIFICAR:** Rol presente sin delay

**Resultado esperado:**
- Tiempo de carga del rol: <50ms
- Sin mensaje "Sin rol"
- Cookies con MaxAge=604800 (7 días)

---

#### ✓ Test 2: Timeout en Queries - Usuarios
**Objetivo:** Verificar que las queries tienen timeout y no se quedan cargando infinitamente

**Pasos:**
1. Abrir DevTools → Console
2. Navegar a "Gestión de Usuarios" (`/dashboard/admin/usuarios`)
3. Simular conexión lenta: DevTools → Network → Throttling → Slow 3G
4. Recargar la página
5. ✅ **VERIFICAR:** Después de 10s máximo, debe aparecer error
6. ✅ **VERIFICAR:** Toast: "Timeout al cargar usuarios después de 10 segundos"
7. ✅ **VERIFICAR:** `isLoading` se pone en `false`

**Resultado esperado:**
- Máximo 10 segundos de espera
- Error claro mostrado al usuario
- No carga infinita

---

#### ✓ Test 3: Timeout Aumentado en AuthContext
**Objetivo:** Verificar que el AuthContext tiene 15s de timeout

**Pasos:**
1. Abrir DevTools → Console
2. Limpiar cookies (simular cold start)
3. Recargar la página
4. Observar logs en Console
5. ✅ **VERIFICAR:** "⚠️ [AuthContext] Timeout alcanzado después de 15 segundos"
6. ✅ **VERIFICAR:** "⚠️ [AuthContext] Esto puede indicar problemas de conexión"

**Resultado esperado:**
- Timeout de 15 segundos (no 8)
- Mensaje específico de problemas de conexión

---

#### ✓ Test 4: Limpieza de Cookies en Logout
**Objetivo:** Verificar que las cookies se eliminan al cerrar sesión

**Pasos:**
1. Hacer login
2. Verificar cookies `user_rol` y `user_estado` presentes
3. Hacer logout
4. ✅ **VERIFICAR:** Cookies eliminadas
5. Intentar acceder a dashboard
6. ✅ **VERIFICAR:** Redirige a login

---

### FASE 2: Mejoras de UX

#### ✓ Test 5: LoadingWithTimeout - Gestión de Usuarios
**Objetivo:** Verificar que el componente LoadingWithTimeout funciona correctamente

**Pasos:**
1. Navegar a "Gestión de Usuarios"
2. Simular conexión lenta (Slow 3G)
3. Observar la interfaz
4. ✅ **VERIFICAR:** Spinner con mensaje "Cargando usuarios..."
5. ✅ **VERIFICAR:** Contador de segundos visible
6. Esperar 12 segundos
7. ✅ **VERIFICAR:** Aparece mensaje: "La carga está tardando más de lo esperado"
8. ✅ **VERIFICAR:** Botones visibles: "Recargar página" y "Esperar más"
9. Click en "Esperar más"
10. ✅ **VERIFICAR:** Continúa esperando (timeout se resetea)
11. Click en "Recargar página"
12. ✅ **VERIFICAR:** Página se recarga completamente

---

#### ✓ Test 6: LoadingWithTimeout - Dashboard Layout
**Objetivo:** Verificar timeout en el layout principal

**Pasos:**
1. Limpiar todas las cookies
2. Navegar al dashboard
3. Simular conexión lenta
4. ✅ **VERIFICAR:** Loading con contador visible
5. ✅ **VERIFICAR:** Timeout después de 10s
6. ✅ **VERIFICAR:** Opción de recargar disponible

---

#### ✓ Test 7: SessionHelper con Timeout
**Objetivo:** Verificar que withRetry tiene timeout integrado

**Pasos:**
1. Ir a cualquier acción que use Server Actions (ej: crear voto)
2. Abrir DevTools → Network → Offline
3. Intentar crear un voto
4. Observar Console
5. ✅ **VERIFICAR:** Logs: "⚠️ Intento 1/2 falló"
6. ✅ **VERIFICAR:** Después de reintentos, error: "Timeout de operación"
7. ✅ **VERIFICAR:** No espera infinita

---

#### ✓ Test 8: Pre-carga de Rol en Middleware
**Objetivo:** Verificar que el middleware carga el rol en headers

**Pasos:**
1. Hacer login
2. Abrir DevTools → Network
3. Navegar al dashboard
4. Click en cualquier request de navegación
5. Ver "Response Headers"
6. ✅ **VERIFICAR:** Header `X-User-Rol` presente
7. ✅ **VERIFICAR:** Header `X-User-Estado` presente
8. ✅ **VERIFICAR:** Valores coinciden con el rol del usuario

**Resultado esperado:**
```
X-User-Rol: admin
X-User-Estado: activo
```

---

## 🔍 Escenarios de Error Comunes

### Escenario 1: "Sin rol" después de recargar
**Causa:** Cookies no se guardaron o expiraron  
**Solución:** Verificar que setCookie se ejecuta después del login

### Escenario 2: Carga infinita sin error
**Causa:** Query sin timeout aplicado  
**Solución:** Verificar que se usa Promise.race con timeout

### Escenario 3: Headers X-User-Rol no aparecen
**Causa:** Middleware no se ejecuta en la ruta  
**Solución:** Verificar config.matcher en middleware.ts

---

## 📊 Métricas a Observar

### Performance
- **Tiempo de carga de rol:** <50ms (con cookies) o <3s (sin cookies)
- **Tiempo hasta timeout:** 10-20s según componente
- **Tiempo de respuesta del middleware:** <100ms

### Experiencia de Usuario
- **Feedback visual:** Siempre presente durante carga
- **Mensajes de error:** Claros y accionables
- **Control:** Usuario puede recargar o esperar más

### Logs (Console)
```
✅ [Login] Rol guardado en cookies para acceso rápido
✅ [AuthContext] Rol obtenido de cookie (INSTANTÁNEO): admin
✅ [AuthContext] Rol guardado en cookies
⚠️ [AuthContext] Timeout alcanzado después de 15 segundos
❌ Timeout al cargar usuarios después de 10 segundos
```

---

## 🐛 Debugging

### Ver cookies en DevTools
```javascript
// En Console
document.cookie.split('; ').forEach(c => console.log(c))
```

### Ver headers de respuesta
```javascript
// En Console después de navegación
performance.getEntriesByType('navigation')[0]
```

### Forzar timeout para pruebas
```javascript
// Modificar temporalmente en el código
const timeoutMs = 3000 // Reducir a 3s para probar
```

---

## ✅ Criterios de Aceptación

### FASE 1
- [ ] Rol se carga en <50ms con cookies
- [ ] Timeout máximo de 15s en AuthContext
- [ ] Timeout de 10-20s en todas las queries
- [ ] Sin cargas infinitas en ningún componente
- [ ] Cookies se limpian en logout

### FASE 2
- [ ] LoadingWithTimeout visible en componentes críticos
- [ ] Botones "Recargar" y "Esperar más" funcionan
- [ ] SessionHelper tiene timeout integrado
- [ ] Headers X-User-Rol presentes en middleware
- [ ] Logs detallados en Console

---

## 🚀 Comandos Útiles

### Limpiar cookies via Console
```javascript
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;"
})
```

### Verificar timeout de una query
```javascript
const start = Date.now()
// ... ejecutar query
console.log('Tiempo:', Date.now() - start, 'ms')
```

### Simular cold start
1. Cerrar todas las pestañas
2. Esperar 5+ minutos
3. Abrir nueva pestaña
4. Verificar comportamiento

---

**Fecha de creación:** 17 de enero de 2026  
**Versión:** 1.0  
**Estado:** ✅ Listo para pruebas
