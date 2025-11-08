# 📋 Plan de Implementación - CRUD Completo de Usuarios

## 📊 Análisis del Estado Actual

### ✅ Funcionalidades Existentes
- **CREATE** ✅ Crear usuario (formulario + API)
- **READ** ✅ Listar usuarios
- **UPDATE** ⚠️ Parcial (solo aprobar/rechazar/reactivar)
- **DELETE** ❌ No implementado

### 🔍 Problemas Identificados

1. **Falta funcionalidad de EDITAR**:
   - No se puede cambiar el email
   - No se puede cambiar el rol
   - No se puede resetear contraseña

2. **Falta funcionalidad de ELIMINAR**:
   - No hay botón para eliminar usuarios
   - No hay confirmación de eliminación
   - No hay soft delete vs hard delete

3. **Validaciones incompletas**:
   - No valida emails duplicados en el frontend
   - No hay feedback visual al crear usuario exitosamente

4. **UX mejorable**:
   - No hay modal para editar
   - No hay confirmaciones para acciones destructivas
   - Falta toast notifications

---

## 🎯 Plan de Implementación

### **FASE 1: Componentes Base** (30 min)
Crear componentes reutilizables para modales y notificaciones

#### Archivos a crear:
1. `src/components/ui/Modal.tsx` - Modal genérico
2. `src/components/ui/Toast.tsx` - Sistema de notificaciones
3. `src/components/ui/ConfirmDialog.tsx` - Diálogo de confirmación

---

### **FASE 2: Editar Usuario** (45 min)
Implementar funcionalidad completa de edición

#### Archivos a crear/modificar:
1. `src/components/admin/EditarUsuarioModal.tsx` - Modal de edición
2. `src/app/api/admin/usuarios/[id]/route.ts` - API PUT
3. `src/app/actions/usuarios.ts` - Agregar `editarUsuario()`
4. `src/app/dashboard/admin/usuarios/page.tsx` - Agregar botón editar

#### Funcionalidades:
- ✅ Editar email (con validación)
- ✅ Cambiar rol (admin, usuario, tesorero)
- ✅ Cambiar estado (activo, inactivo)
- ✅ Validar que no exista el email
- ✅ Actualizar en auth.users y usuarios

---

### **FASE 3: Eliminar Usuario** (30 min)
Implementar eliminación con confirmación

#### Archivos a crear/modificar:
1. `src/app/api/admin/usuarios/[id]/route.ts` - API DELETE
2. `src/app/actions/usuarios.ts` - Agregar `eliminarUsuario()`
3. `src/app/dashboard/admin/usuarios/page.tsx` - Agregar botón eliminar

#### Funcionalidades:
- ✅ Soft delete (cambiar estado a 'eliminado')
- ✅ Hard delete opcional (eliminar de auth y BD)
- ✅ Confirmación antes de eliminar
- ✅ No permitir eliminar al usuario actual
- ✅ No permitir eliminar si es el único admin

---

### **FASE 4: Resetear Contraseña** (20 min)
Permitir al admin resetear contraseñas

#### Archivos a crear/modificar:
1. `src/app/api/admin/usuarios/[id]/reset-password/route.ts` - API POST
2. `src/app/actions/usuarios.ts` - Agregar `resetearPassword()`
3. `src/components/admin/ResetPasswordModal.tsx` - Modal

#### Funcionalidades:
- ✅ Generar contraseña temporal
- ✅ Enviar email al usuario (opcional)
- ✅ Mostrar contraseña temporal al admin
- ✅ Forzar cambio en próximo login

---

### **FASE 5: Mejoras UX** (30 min)
Mejorar experiencia de usuario

#### Mejoras:
- ✅ Toast notifications para todas las acciones
- ✅ Loading states en todos los botones
- ✅ Confirmaciones para acciones destructivas
- ✅ Mensajes de éxito/error claros
- ✅ Animaciones suaves
- ✅ Feedback visual inmediato

---

### **FASE 6: Validaciones y Seguridad** (20 min)
Reforzar validaciones y seguridad

#### Mejoras:
- ✅ Validar permisos en todas las APIs
- ✅ Rate limiting para creación de usuarios
- ✅ Logs de auditoría
- ✅ Validar que el admin no se elimine a sí mismo
- ✅ Validar que siempre haya al menos un admin

---

## 📁 Estructura de Archivos

```
src/
├── components/
│   ├── ui/
│   │   ├── Modal.tsx                    [NUEVO]
│   │   ├── Toast.tsx                    [NUEVO]
│   │   └── ConfirmDialog.tsx            [NUEVO]
│   └── admin/
│       ├── CrearUsuarioForm.tsx         [EXISTENTE]
│       ├── EditarUsuarioModal.tsx       [NUEVO]
│       └── ResetPasswordModal.tsx       [NUEVO]
├── app/
│   ├── actions/
│   │   └── usuarios.ts                  [MODIFICAR]
│   ├── api/
│   │   └── admin/
│   │       └── usuarios/
│   │           ├── route.ts             [EXISTENTE]
│   │           └── [id]/
│   │               ├── route.ts         [NUEVO - PUT/DELETE]
│   │               └── reset-password/
│   │                   └── route.ts     [NUEVO]
│   └── dashboard/
│       └── admin/
│           └── usuarios/
│               └── page.tsx             [MODIFICAR]
└── lib/
    └── hooks/
        └── useToast.ts                  [NUEVO]
```

---

## 🔧 Detalles Técnicos

### API Endpoints

#### 1. **PUT /api/admin/usuarios/[id]** - Editar usuario
```typescript
Body: {
  email?: string
  rol?: 'admin' | 'usuario' | 'tesorero'
  estado?: 'activo' | 'inactivo'
}
Response: { success: boolean, user: Usuario }
```

#### 2. **DELETE /api/admin/usuarios/[id]** - Eliminar usuario
```typescript
Query: ?soft=true (opcional)
Response: { success: boolean }
```

#### 3. **POST /api/admin/usuarios/[id]/reset-password** - Resetear contraseña
```typescript
Response: { 
  success: boolean, 
  temporaryPassword: string 
}
```

---

### Componentes UI

#### Modal.tsx
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}
```

#### Toast.tsx
```typescript
interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}
```

#### ConfirmDialog.tsx
```typescript
interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}
```

---

## 🎨 Diseño UI/UX

### Tabla de Usuarios - Nuevas Acciones

```
┌─────────────────────────────────────────────────────────┐
│ ID  │ Email           │ Estado      │ Acciones          │
├─────────────────────────────────────────────────────────┤
│ ... │ user@email.com  │ Activo      │ [✏️] [🔑] [🗑️]   │
│     │                 │ Admin       │                    │
└─────────────────────────────────────────────────────────┘

✏️ Editar - Abre modal de edición
🔑 Reset Password - Genera nueva contraseña
🗑️ Eliminar - Confirma y elimina
```

### Modal de Edición

```
┌──────────────────────────────────────┐
│  Editar Usuario                   [X]│
├──────────────────────────────────────┤
│                                      │
│  Email: [user@email.com         ]   │
│                                      │
│  Rol:   [▼ Administrador        ]   │
│                                      │
│  Estado: [▼ Activo              ]   │
│                                      │
│  [Cancelar]  [Guardar Cambios]      │
└──────────────────────────────────────┘
```

### Confirmación de Eliminación

```
┌──────────────────────────────────────┐
│  ⚠️ Confirmar Eliminación            │
├──────────────────────────────────────┤
│                                      │
│  ¿Estás seguro de eliminar a:       │
│  user@email.com?                     │
│                                      │
│  Esta acción no se puede deshacer.   │
│                                      │
│  [Cancelar]  [Eliminar]              │
└──────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

### FASE 1: Componentes Base
- [ ] Crear `Modal.tsx`
- [ ] Crear `Toast.tsx` y `useToast.ts`
- [ ] Crear `ConfirmDialog.tsx`
- [ ] Probar componentes independientemente

### FASE 2: Editar Usuario
- [ ] Crear API PUT `/api/admin/usuarios/[id]`
- [ ] Crear `EditarUsuarioModal.tsx`
- [ ] Agregar `editarUsuario()` en actions
- [ ] Agregar botón "Editar" en tabla
- [ ] Validar permisos
- [ ] Probar edición completa

### FASE 3: Eliminar Usuario
- [ ] Crear API DELETE `/api/admin/usuarios/[id]`
- [ ] Agregar `eliminarUsuario()` en actions
- [ ] Agregar botón "Eliminar" con confirmación
- [ ] Implementar validaciones (no eliminar a sí mismo, mantener 1 admin)
- [ ] Probar eliminación

### FASE 4: Resetear Contraseña
- [ ] Crear API POST `/api/admin/usuarios/[id]/reset-password`
- [ ] Crear `ResetPasswordModal.tsx`
- [ ] Agregar `resetearPassword()` en actions
- [ ] Agregar botón "Reset Password"
- [ ] Mostrar contraseña temporal
- [ ] Probar reset

### FASE 5: Mejoras UX
- [ ] Integrar toast en todas las acciones
- [ ] Agregar loading states
- [ ] Mejorar mensajes de error
- [ ] Agregar animaciones
- [ ] Mejorar responsive

### FASE 6: Validaciones y Seguridad
- [ ] Validar permisos en todas las APIs
- [ ] Agregar logs de auditoría
- [ ] Implementar rate limiting
- [ ] Validaciones de seguridad
- [ ] Pruebas de seguridad

---

## 🚀 Estimación de Tiempo

| Fase | Tiempo Estimado | Prioridad |
|------|----------------|-----------|
| FASE 1 | 30 min | Alta |
| FASE 2 | 45 min | Alta |
| FASE 3 | 30 min | Alta |
| FASE 4 | 20 min | Media |
| FASE 5 | 30 min | Media |
| FASE 6 | 20 min | Alta |
| **TOTAL** | **2h 55min** | - |

---

## 📝 Notas Importantes

1. **Backup antes de implementar**: Hacer backup de la BD antes de probar eliminaciones
2. **Probar en desarrollo**: No probar eliminaciones en producción
3. **Logs de auditoría**: Registrar todas las acciones de admin
4. **Permisos**: Solo admins pueden acceder a estas funciones
5. **Validaciones**: Siempre validar en backend, no confiar en frontend

---

## 🎯 Resultado Final

Al completar este plan, tendrás:

✅ **CRUD Completo**:
- Crear usuarios ✅
- Leer/Listar usuarios ✅
- Editar usuarios ✅
- Eliminar usuarios ✅

✅ **Funcionalidades Extra**:
- Resetear contraseñas ✅
- Aprobar/Rechazar usuarios ✅
- Activar/Desactivar usuarios ✅

✅ **UX Profesional**:
- Modales elegantes ✅
- Notificaciones toast ✅
- Confirmaciones ✅
- Loading states ✅
- Responsive design ✅

✅ **Seguridad**:
- Validaciones completas ✅
- Logs de auditoría ✅
- Rate limiting ✅
- Permisos estrictos ✅

---

*Última actualización: 7 de noviembre de 2025*  
*Desarrollado para: IPUC Contabilidad*
