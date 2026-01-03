-- ============================================================================
-- Agregar políticas de UPDATE y DELETE para comite_ofrendas
-- Fecha: 2026-01-04
-- Descripción: Permitir a líderes y tesoreros actualizar y eliminar ofrendas
-- ============================================================================

-- Política: Admins, líderes y tesoreros pueden actualizar ofrendas
CREATE POLICY "leaders_treasurers_update_ofrendas"
  ON public.comite_ofrendas
  FOR UPDATE
  USING (
    -- Admins tienen acceso total
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol = 'admin'
    )
    OR
    -- Líderes y tesoreros del comité pueden actualizar
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_ofrendas.comite_id
        AND usuario_id = auth.uid()
        AND rol IN ('lider', 'tesorero')
        AND estado = 'activo'
    )
  );

-- Política: Admins, líderes y tesoreros pueden eliminar ofrendas
CREATE POLICY "leaders_treasurers_delete_ofrendas"
  ON public.comite_ofrendas
  FOR DELETE
  USING (
    -- Admins tienen acceso total
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND rol = 'admin'
    )
    OR
    -- Líderes y tesoreros del comité pueden eliminar
    EXISTS (
      SELECT 1 FROM public.comite_usuarios
      WHERE comite_id = comite_ofrendas.comite_id
        AND usuario_id = auth.uid()
        AND rol IN ('lider', 'tesorero')
        AND estado = 'activo'
    )
  );

-- ============================================================================
-- Comentarios sobre las políticas
-- ============================================================================
COMMENT ON POLICY "leaders_treasurers_update_ofrendas" ON public.comite_ofrendas IS 
'Permite a administradores, líderes y tesoreros actualizar ofrendas de sus comités';

COMMENT ON POLICY "leaders_treasurers_delete_ofrendas" ON public.comite_ofrendas IS 
'Permite a administradores, líderes y tesoreros eliminar ofrendas de sus comités';
