# IPUC Contabilidad - Product Requirements Document

## Resumen Ejecutivo
Sistema completo de contabilidad y gestión de comités para la Iglesia IPUC, desarrollado con Next.js, React, TypeScript y Supabase.

## Características Principales
1. **Autenticación y Control de Acceso** - JWT basado en Supabase con 4 roles de usuario
2. **Dashboard** - Panel principal con estadísticas y votos activos
3. **Gestión de Comités** - CRUD completo con 26 rutas dinámicas
4. **Votos** - Sistema de votación con seguimiento y vencimiento
5. **Ofrendas** - Registro y gestión de ofrendas
6. **Gastos** - Administración de gastos por comité
7. **Administración de Usuarios** - Gestión completa de usuarios y roles
8. **Reportes PDF** - Generación de reportes en PDF

## Tecnologías
- Frontend: Next.js 16.1.0, React 18.3.1, Tailwind CSS
- Backend: Supabase, PostgreSQL, Server Actions
- Database: 8 tablas con RLS policies
- API: Routes REST con autenticación

## Estado
✅ Listo para Producción - Build exitoso sin errores TypeScript
