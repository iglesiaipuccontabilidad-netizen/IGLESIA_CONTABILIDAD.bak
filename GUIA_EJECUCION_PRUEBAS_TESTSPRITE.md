# 📋 Guía de Ejecución de Pruebas TestSprite

## 📊 Plan de Pruebas Fronted Generado

**Archivo Principal:** `testsprite_tests/testsprite_frontend_test_plan.json`

### 17 Casos de Prueba Generados

#### 🔐 Autenticación (2 casos)
- **TC001**: Login con credenciales correctas
- **TC002**: Login con credenciales incorrectas

#### 🛡️ Seguridad (2 casos)
- **TC003**: Control de acceso por roles (RBAC)
- **TC016**: Políticas de seguridad RLS en base de datos

#### 📊 Dashboard (2 casos)
- **TC004**: Datos en tiempo real del dashboard
- **TC015**: Manejo de grandes volúmenes de datos

#### 🏛️ Comités (2 casos)
- **TC005**: CRUD completo de comités
- **TC006**: Gestión de miembros del comité

#### 🗳️ Votos (2 casos)
- **TC007**: Ciclo de vida de votos
- **TC008**: Expiración de votos (edge case)

#### 💰 Ofrendas y Gastos (2 casos)
- **TC009**: CRUD de ofrendas con validación
- **TC010**: Gestión de gastos con presupuesto

#### 👤 Administración (1 caso)
- **TC011**: Gestión de usuarios y permisos

#### 📄 Reportes (1 caso)
- **TC012**: Generación y descarga de PDF

#### 🔌 APIs (1 caso)
- **TC013**: Validación de endpoints REST

#### ✅ Validación (1 caso)
- **TC014**: Validación de formularios con Zod
- **TC017**: Build y runtime de producción

---

## 🚀 Cómo Ejecutar las Pruebas

### Método 1: Desde VS Code (Interfaz Visual) ⭐ RECOMENDADO
1. Abre VS Code en tu máquina local
2. Conecta al proyecto remoto (si aplica)
3. TestSprite reconocerá automáticamente el plan en `testsprite_tests/`
4. Presiona `Ctrl+Shift+P` y busca "TestSprite: Run Tests"
5. Selecciona los casos de prueba a ejecutar
6. Visualiza resultados en tiempo real

### Método 2: Terminal com npm Script
```bash
# Navega al proyecto
cd /home/juanda/ipuc-contabilidad

# Ejecuta el servidor de desarrollo
npm run dev

# En otra terminal, ejecuta testsprite
npx @testsprite/testsprite-mcp@latest generateCodeAndExecute
```

### Método 3: Dashboard Web
TestSprite genera un dashboard interactivo:
- URL: `http://localhost:46799` (puerto dinámico)
- Permite: Ver tests, ejecutarlos, revisar resultados, modificar pasos

---

## 📈 Métricas de Cobertura

| Categoría | Casos | Prioridad |
|-----------|-------|-----------|
| Funcional | 11 | Alta/Media |
| Seguridad | 4 | Alta |
| Error Handling | 2 | Alta/Media |
| **Total** | **17** | - |

---

## ✅ Requisitos Previos

- ✅ Servidor de desarrollo Next.js corriendo (`npm run dev`)
- ✅ Puerto 3000 disponible
- ✅ Base de datos Supabase conectada
- ✅ Credenciales de prueba:
  - Admin user: email/password válidos
  - Tesorero user: credenciales de tesorero
  - Usuario normal: credenciales de usuario

---

## 🔍 Qué Prueban los Test Cases

### Autenticación & Autorización
- Login exitoso con JWT
- Rechazo de credenciales inválidas
- RBAC (acceso por roles)
- Seguridad RLS en BD

### Funcionalidad Principal
- ✅ CRUD de comités
- ✅ Gestión de votos (ciclo completo + expiración)
- ✅ Ofrendas (categorización + validación)
- ✅ Gastos (presupuesto + categorización)
- ✅ Usuarios (roles + permisos)
- ✅ Reportes PDF

### Calidad
- Validación de formularios Zod
- Manejo de grandes volúmenes
- Build de producción
- Endpoints API

---

## 📝 Pasos para Implementar Manualmente

Si prefieres ejecutar pruebas manualmente sin TestSprite:

### Test 1: Login (TC001)
```bash
1. Abre http://localhost:3000/login
2. Ingresa credenciales válidas
3. Verifica que se redirige al dashboard
4. Comprueba que el JWT está en localStorage/cookies
```

### Test 2: CRUD Comités (TC005)
```bash
1. Navega a /dashboard/comites
2. Crea nuevo comité (+ botón)
3. Edita el comité
4. Visualiza detalles
5. Elimina el comité
6. Verifica que desapare de la lista
```

### Test 3: Votación (TC007)
```bash
1. Entra a comité específico
2. Crea nuevo voto
3. Simula votación de miembros
4. Verifica cambios de estado
5. Comprueba expiración
```

---

## 🎯 Próximos Pasos

1. **Iniciar ejecución**: Abre TestSprite desde VS Code
2. **Revisar resultados**: Lee el reporte en `testsprite_tests/testsprite-mcp-test-report.md`
3. **Identificar fallos**: Si algún test falla, revisa logs en `testsprite_tests/tmp/`
4. **Iterar**: Modifica el plan según necesidades
5. **Automatizar**: Integra en CI/CD (GitHub Actions, etc.)

---

## 📞 Recursos

- **Documentación TestSprite**: https://docs.testsprite.com
- **Plan de Pruebas**: `testsprite_tests/testsprite_frontend_test_plan.json`
- **Resumen de Código**: `testsprite_tests/tmp/code_summary.json`
- **PRD del Proyecto**: `testsprite_tests/tmp/prd_files/PRD.md`

---

**Generado:** 8 de febrero de 2026
**Estado:** ✅ Plan listo para ejecución
