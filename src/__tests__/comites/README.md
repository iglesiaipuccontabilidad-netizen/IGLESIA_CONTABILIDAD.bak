# Tests del Módulo de Comités

## 📋 Estructura de Tests

### 1. **comites-crud.test.ts**
Tests unitarios para cada operación CRUD:
- ✅ CREATE: Crear comités, miembros, proyectos, votos, ofrendas, gastos
- ✅ READ: Obtener y listar recursos
- ✅ UPDATE: Actualizar datos
- ✅ DELETE: Eliminar/desactivar recursos
- ✅ PERMISOS: Validar autorizaciones

### 2. **comites-integration.test.ts**
Tests de integración que prueban flujos completos:
- 🔄 Flujo 1: Crear comité → Asignar usuarios → Agregar miembros → Crear proyecto
- 💰 Flujo 2: Crear votos → Registrar pagos → Verificar balance
- ⏰ Flujo 3: Votos vencidos y actualización automática
- 📊 Flujo 4: Dashboard completo con todas las estadísticas
- ⚡ Tests de performance
- 🔀 Tests de concurrencia

## 🚀 Cómo ejecutar los tests

### Prerequisitos
```bash
npm install --save-dev @jest/globals jest ts-jest @types/jest
```

### Configuración Jest
Crear `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

### Ejecutar tests
```bash
# Todos los tests
npm test

# Solo tests de comités
npm test comites

# Tests con coverage
npm test -- --coverage

# Tests en modo watch
npm test -- --watch
```

## 📊 Cobertura Esperada

- **Comités CRUD**: 100%
  - Crear, leer, actualizar, desactivar comités
  
- **Usuarios de Comité**: 100%
  - Asignar, actualizar rol, remover usuarios
  
- **Miembros**: 100%
  - Crear, actualizar, desactivar miembros
  
- **Proyectos**: 100%
  - Crear, actualizar, cancelar proyectos
  
- **Votos**: 100%
  - Crear, actualizar, completar, cancelar votos
  
- **Pagos**: 100%
  - Registrar pagos contra votos
  - Actualizar estado de votos
  
- **Ofrendas**: 100%
  - Registrar, actualizar, eliminar ofrendas
  
- **Gastos**: 100%
  - Registrar, actualizar, eliminar gastos
  
- **Balance y Estadísticas**: 100%
  - Calcular balance correctamente
  - Estadísticas actualizadas

## 🧪 Casos de Prueba Importantes

### Validaciones de Negocio
1. ✅ No permitir nombres de comité duplicados
2. ✅ No permitir montos negativos
3. ✅ No permitir pago mayor al monto del voto
4. ✅ Actualizar automáticamente monto_pagado
5. ✅ Marcar voto como completado al pagar el total
6. ✅ Vencer votos automáticamente después de fecha_limite

### Permisos y Seguridad
1. ✅ Solo admin/tesorero puede crear comités
2. ✅ Solo usuarios asignados pueden ver datos del comité
3. ✅ Solo líder/tesorero puede registrar ofrendas
4. ✅ Solo admin puede eliminar recursos
5. ✅ Validar acceso en todas las operaciones

### Integridad de Datos
1. ✅ Balance = Ingresos - Egresos
2. ✅ Ingresos = Ofrendas + Pagos
3. ✅ Proyecto.monto_recaudado = suma de votos pagados
4. ✅ Datos históricos se mantienen al desactivar

## 📝 Implementación Pendiente

Los tests actualmente tienen placeholders (`expect(true).toBe(true)`).

Para completar la implementación:

1. **Configurar entorno de testing**
   - Instalar dependencias Jest
   - Configurar base de datos de testing
   - Setup/teardown de datos de prueba

2. **Implementar llamadas reales**
   - Importar actions de comités
   - Crear datos de prueba
   - Implementar assertions reales

3. **Agregar helpers**
   ```typescript
   // Ejemplo: src/__tests__/helpers/test-utils.ts
   export async function crearComiteTest() {
     return await createComite({
       nombre: `Test-${Date.now()}`,
       descripcion: 'Comité de prueba'
     })
   }
   ```

4. **Mock de Supabase**
   - Configurar cliente Supabase para testing
   - Usar base de datos separada o mocks

## 🎯 Próximos Pasos

1. ✅ Instalar dependencias de testing
2. ✅ Configurar Jest
3. ⏳ Implementar tests unitarios básicos
4. ⏳ Implementar tests de integración
5. ⏳ Agregar tests de performance
6. ⏳ Configurar CI/CD para ejecutar tests automáticamente

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [Testing Next.js](https://nextjs.org/docs/testing)
- [Supabase Testing](https://supabase.com/docs/guides/getting-started/testing)
