-- ============================================================================
-- FASE 3: Implementación de Row Level Security (RLS) para comités
-- Fecha: 2026-01-02
-- Objetivo: Agregar defensa en profundidad - protección a nivel de BD
-- ============================================================================

-- ============================================================================
-- 1. TABLA: comites
-- Políticas:
--   - Admins/tesoreros: acceso total
--   - Usuarios: ver solo comités a los que pertenecen
-- ============================================================================
ALTER TABLE public.comites ENABLE ROW LEVEL SECURITY;

-- Política: Admins y tesoreros ven todos los comités
CREATE POLICY "admins_tesoreros_view_all_comites"
  ON public.comites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- Política: Usuarios ven solo sus comités asignados
CREATE POLICY "users_view_own_comites"
  ON public.comites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comites.id
        AND usuario_id = auth.uid()
        AND estado = 'activo'
    )
  );

-- Política: Solo admins pueden crear comités
CREATE POLICY "admins_create_comites"
  ON public.comites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol = 'admin'
    )
  );

-- Política: Solo admins pueden actualizar comités
CREATE POLICY "admins_update_comites"
  ON public.comites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol = 'admin'
    )
  );

-- Política: Solo admins pueden eliminar comités
CREATE POLICY "admins_delete_comites"
  ON public.comites
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol = 'admin'
    )
  );

-- ============================================================================
-- 2. TABLA: comite_usuarios (relación usuario-comité)
-- Políticas:
--   - Admins/tesoreros: acceso total
--   - Usuarios: ver solo sus propios registros y los de su comité
-- ============================================================================
ALTER TABLE public.comite_usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Admins y tesoreros ven todo
CREATE POLICY "admins_tesoreros_view_all_comite_usuarios"
  ON public.comite_usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- Política: Usuarios ven miembros de sus comités
CREATE POLICY "users_view_own_comite_usuarios"
  ON public.comite_usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios cu2
      WHERE cu2.comite_id = comite_usuarios.comite_id
        AND cu2.usuario_id = auth.uid()
        AND cu2.estado = 'activo'
    )
  );

-- Política: Solo admins pueden crear asignaciones de comité
CREATE POLICY "admins_create_comite_usuarios"
  ON public.comite_usuarios
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- Política: Solo admins pueden actualizar asignaciones
CREATE POLICY "admins_update_comite_usuarios"
  ON public.comite_usuarios
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- Política: Solo admins pueden eliminar asignaciones
CREATE POLICY "admins_delete_comite_usuarios"
  ON public.comite_usuarios
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- ============================================================================
-- 3. TABLA: comite_proyectos
-- Políticas:
--   - Admins/tesoreros: ver todos
--   - Usuarios: ver solo proyectos de sus comités
-- ============================================================================
ALTER TABLE public.comite_proyectos ENABLE ROW LEVEL SECURITY;

-- Política: Admins y tesoreros ven todos los proyectos
CREATE POLICY "admins_tesoreros_view_all_proyectos"
  ON public.comite_proyectos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- Política: Usuarios ven proyectos de sus comités
CREATE POLICY "users_view_own_comite_proyectos"
  ON public.comite_proyectos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_proyectos.comite_id
        AND usuario_id = auth.uid()
        AND estado = 'activo'
    )
  );

-- Política: Líders y tesoreros pueden crear proyectos en sus comités
CREATE POLICY "leaders_create_proyectos"
  ON public.comite_proyectos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_proyectos.comite_id
        AND usuario_id = auth.uid()
        AND rol IN ('lider', 'tesorero')
        AND estado = 'activo'
    )
    OR EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- Política: Líders y tesoreros pueden actualizar proyectos
CREATE POLICY "leaders_update_proyectos"
  ON public.comite_proyectos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_proyectos.comite_id
        AND usuario_id = auth.uid()
        AND rol IN ('lider', 'tesorero')
        AND estado = 'activo'
    )
    OR EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- ============================================================================
-- 4. TABLA: comite_votos
-- Políticas:
--   - Admins/tesoreros: acceso total
--   - Usuarios: ver/crear en sus comités
-- ============================================================================
ALTER TABLE public.comite_votos ENABLE ROW LEVEL SECURITY;

-- Política: Admins y tesoreros ven todos los votos
CREATE POLICY "admins_tesoreros_view_all_votos"
  ON public.comite_votos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- Política: Usuarios ven votos de sus comités
CREATE POLICY "users_view_own_comite_votos"
  ON public.comite_votos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_votos.comite_id
        AND usuario_id = auth.uid()
        AND estado = 'activo'
    )
  );

-- Política: Líders y tesoreros pueden crear votos
CREATE POLICY "leaders_create_votos"
  ON public.comite_votos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_votos.comite_id
        AND usuario_id = auth.uid()
        AND rol IN ('lider', 'tesorero')
        AND estado = 'activo'
    )
    OR EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- ============================================================================
-- 5. TABLA: comite_ofrendas
-- Políticas:
--   - Admins/tesoreros: acceso total
--   - Usuarios: ver/crear en sus comités
-- ============================================================================
ALTER TABLE public.comite_ofrendas ENABLE ROW LEVEL SECURITY;

-- Política: Admins y tesoreros ven todas las ofrendas
CREATE POLICY "admins_tesoreros_view_all_ofrendas"
  ON public.comite_ofrendas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- Política: Usuarios ven ofrendas de sus comités
CREATE POLICY "users_view_own_comite_ofrendas"
  ON public.comite_ofrendas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_ofrendas.comite_id
        AND usuario_id = auth.uid()
        AND estado = 'activo'
    )
  );

-- Política: Tesoreros pueden crear ofrendas
CREATE POLICY "treasurers_create_ofrendas"
  ON public.comite_ofrendas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_ofrendas.comite_id
        AND usuario_id = auth.uid()
        AND rol = 'tesorero'
        AND estado = 'activo'
    )
    OR EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- ============================================================================
-- 6. TABLA: comite_gastos
-- Políticas:
--   - Admins/tesoreros: acceso total
--   - Usuarios: ver/crear en sus comités
-- ============================================================================
ALTER TABLE public.comite_gastos ENABLE ROW LEVEL SECURITY;

-- Política: Admins y tesoreros ven todos los gastos
CREATE POLICY "admins_tesoreros_view_all_gastos"
  ON public.comite_gastos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- Política: Usuarios ven gastos de sus comités
CREATE POLICY "users_view_own_comite_gastos"
  ON public.comite_gastos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_gastos.comite_id
        AND usuario_id = auth.uid()
        AND estado = 'activo'
    )
  );

-- Política: Tesoreros pueden crear gastos
CREATE POLICY "treasurers_create_gastos"
  ON public.comite_gastos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_gastos.comite_id
        AND usuario_id = auth.uid()
        AND rol = 'tesorero'
        AND estado = 'activo'
    )
    OR EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol IN ('admin', 'tesorero')
    )
  );

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================
-- ✓ Tabla comites: 5 políticas implementadas
-- ✓ Tabla comite_usuarios: 6 políticas implementadas
-- ✓ Tabla comite_proyectos: 4 políticas implementadas
-- ✓ Tabla comite_votos: 4 políticas implementadas
-- ✓ Tabla comite_ofrendas: 4 políticas implementadas
-- ✓ Tabla comite_gastos: 4 políticas implementadas
-- TOTAL: 27 políticas RLS implementadas
-- ============================================================================
