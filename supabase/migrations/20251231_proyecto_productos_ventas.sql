-- =========================================
-- SISTEMA DE PRODUCTOS Y VENTAS PARA PROYECTOS
-- =========================================
-- Permite a los proyectos vender productos a compradores externos
-- Coexiste con el sistema de votos (miembros del comité)

-- =========================================
-- TABLA: proyecto_productos
-- Productos configurables por proyecto
-- =========================================
CREATE TABLE IF NOT EXISTS proyecto_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES comite_proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por UUID REFERENCES auth.users(id),
  
  CONSTRAINT producto_nombre_not_empty CHECK (LENGTH(TRIM(nombre)) > 0)
);

-- Índices para proyecto_productos
CREATE INDEX idx_proyecto_productos_proyecto ON proyecto_productos(proyecto_id);
CREATE INDEX idx_proyecto_productos_estado ON proyecto_productos(estado);

-- =========================================
-- TABLA: proyecto_ventas
-- Ventas a compradores externos (no son usuarios del sistema)
-- =========================================
CREATE TABLE IF NOT EXISTS proyecto_ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES comite_proyectos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES proyecto_productos(id) ON DELETE RESTRICT,
  
  -- Datos del comprador (externo)
  comprador_nombre TEXT NOT NULL,
  comprador_telefono TEXT,
  comprador_email TEXT,
  comprador_notas TEXT,
  
  -- Detalles de la venta
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
  valor_total NUMERIC(12, 2) NOT NULL CHECK (valor_total >= 0),
  monto_pagado NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monto_pagado >= 0),
  saldo_pendiente NUMERIC(12, 2) GENERATED ALWAYS AS (valor_total - monto_pagado) STORED,
  
  -- Estado y metadata
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'cancelado')),
  fecha_venta DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registrado_por UUID REFERENCES auth.users(id),
  
  CONSTRAINT comprador_nombre_not_empty CHECK (LENGTH(TRIM(comprador_nombre)) > 0),
  CONSTRAINT valor_total_match CHECK (valor_total = cantidad * precio_unitario),
  CONSTRAINT monto_pagado_no_excede CHECK (monto_pagado <= valor_total)
);

-- Índices para proyecto_ventas
CREATE INDEX idx_proyecto_ventas_proyecto ON proyecto_ventas(proyecto_id);
CREATE INDEX idx_proyecto_ventas_producto ON proyecto_ventas(producto_id);
CREATE INDEX idx_proyecto_ventas_estado ON proyecto_ventas(estado);
CREATE INDEX idx_proyecto_ventas_fecha ON proyecto_ventas(fecha_venta);
CREATE INDEX idx_proyecto_ventas_comprador ON proyecto_ventas(comprador_nombre);

-- =========================================
-- TABLA: proyecto_pagos_ventas
-- Pagos/abonos asociados a ventas
-- =========================================
CREATE TABLE IF NOT EXISTS proyecto_pagos_ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES proyecto_ventas(id) ON DELETE CASCADE,
  monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  referencia TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registrado_por UUID REFERENCES auth.users(id),
  
  CONSTRAINT monto_positivo CHECK (monto > 0)
);

-- Índices para proyecto_pagos_ventas
CREATE INDEX idx_proyecto_pagos_ventas_venta ON proyecto_pagos_ventas(venta_id);
CREATE INDEX idx_proyecto_pagos_ventas_fecha ON proyecto_pagos_ventas(fecha_pago);

-- =========================================
-- TRIGGER: Actualizar monto_pagado en ventas
-- =========================================
CREATE OR REPLACE FUNCTION actualizar_monto_pagado_venta()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular el monto total pagado
  UPDATE proyecto_ventas
  SET 
    monto_pagado = (
      SELECT COALESCE(SUM(monto), 0)
      FROM proyecto_pagos_ventas
      WHERE venta_id = COALESCE(NEW.venta_id, OLD.venta_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.venta_id, OLD.venta_id);
  
  -- Actualizar estado si está completamente pagado
  UPDATE proyecto_ventas
  SET estado = CASE 
    WHEN monto_pagado >= valor_total THEN 'pagado'
    WHEN monto_pagado > 0 THEN 'pendiente'
    ELSE 'pendiente'
  END
  WHERE id = COALESCE(NEW.venta_id, OLD.venta_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para mantener sincronizado el monto_pagado
DROP TRIGGER IF EXISTS trigger_actualizar_monto_pagado_venta_insert ON proyecto_pagos_ventas;
CREATE TRIGGER trigger_actualizar_monto_pagado_venta_insert
  AFTER INSERT ON proyecto_pagos_ventas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_monto_pagado_venta();

DROP TRIGGER IF EXISTS trigger_actualizar_monto_pagado_venta_update ON proyecto_pagos_ventas;
CREATE TRIGGER trigger_actualizar_monto_pagado_venta_update
  AFTER UPDATE ON proyecto_pagos_ventas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_monto_pagado_venta();

DROP TRIGGER IF EXISTS trigger_actualizar_monto_pagado_venta_delete ON proyecto_pagos_ventas;
CREATE TRIGGER trigger_actualizar_monto_pagado_venta_delete
  AFTER DELETE ON proyecto_pagos_ventas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_monto_pagado_venta();

-- =========================================
-- TRIGGER: Actualizar timestamps
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_proyecto_productos_updated_at ON proyecto_productos;
CREATE TRIGGER update_proyecto_productos_updated_at
  BEFORE UPDATE ON proyecto_productos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proyecto_ventas_updated_at ON proyecto_ventas;
CREATE TRIGGER update_proyecto_ventas_updated_at
  BEFORE UPDATE ON proyecto_ventas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- RLS (Row Level Security) - PRODUCTOS
-- =========================================
ALTER TABLE proyecto_productos ENABLE ROW LEVEL SECURITY;

-- Política: Ver productos de proyectos a los que tiene acceso
DROP POLICY IF EXISTS "Ver productos del proyecto" ON proyecto_productos;
CREATE POLICY "Ver productos del proyecto"
  ON proyecto_productos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM comite_proyectos cp
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE cp.id = proyecto_productos.proyecto_id
        AND cu.usuario_id = auth.uid()
        AND cu.estado = 'activo'
    )
  );

-- Política: Crear productos (líderes y tesoreros)
DROP POLICY IF EXISTS "Crear productos del proyecto" ON proyecto_productos;
CREATE POLICY "Crear productos del proyecto"
  ON proyecto_productos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comite_proyectos cp
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE cp.id = proyecto_productos.proyecto_id
        AND cu.usuario_id = auth.uid()
        AND cu.rol IN ('lider', 'tesorero')
        AND cu.estado = 'activo'
    )
  );

-- Política: Actualizar productos (líderes y tesoreros)
DROP POLICY IF EXISTS "Actualizar productos del proyecto" ON proyecto_productos;
CREATE POLICY "Actualizar productos del proyecto"
  ON proyecto_productos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM comite_proyectos cp
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE cp.id = proyecto_productos.proyecto_id
        AND cu.usuario_id = auth.uid()
        AND cu.rol IN ('lider', 'tesorero')
        AND cu.estado = 'activo'
    )
  );

-- Política: Eliminar productos (líderes y tesoreros)
DROP POLICY IF EXISTS "Eliminar productos del proyecto" ON proyecto_productos;
CREATE POLICY "Eliminar productos del proyecto"
  ON proyecto_productos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM comite_proyectos cp
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE cp.id = proyecto_productos.proyecto_id
        AND cu.usuario_id = auth.uid()
        AND cu.rol IN ('lider', 'tesorero')
        AND cu.estado = 'activo'
    )
  );

-- =========================================
-- RLS (Row Level Security) - VENTAS
-- =========================================
ALTER TABLE proyecto_ventas ENABLE ROW LEVEL SECURITY;

-- Política: Ver ventas del proyecto
DROP POLICY IF EXISTS "Ver ventas del proyecto" ON proyecto_ventas;
CREATE POLICY "Ver ventas del proyecto"
  ON proyecto_ventas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM comite_proyectos cp
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE cp.id = proyecto_ventas.proyecto_id
        AND cu.usuario_id = auth.uid()
        AND cu.estado = 'activo'
    )
  );

-- Política: Registrar ventas (todos los miembros activos)
DROP POLICY IF EXISTS "Registrar ventas del proyecto" ON proyecto_ventas;
CREATE POLICY "Registrar ventas del proyecto"
  ON proyecto_ventas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comite_proyectos cp
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE cp.id = proyecto_ventas.proyecto_id
        AND cu.usuario_id = auth.uid()
        AND cu.estado = 'activo'
    )
  );

-- Política: Actualizar ventas (líderes y tesoreros)
DROP POLICY IF EXISTS "Actualizar ventas del proyecto" ON proyecto_ventas;
CREATE POLICY "Actualizar ventas del proyecto"
  ON proyecto_ventas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM comite_proyectos cp
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE cp.id = proyecto_ventas.proyecto_id
        AND cu.usuario_id = auth.uid()
        AND cu.rol IN ('lider', 'tesorero')
        AND cu.estado = 'activo'
    )
  );

-- Política: Eliminar ventas (líderes y tesoreros)
DROP POLICY IF EXISTS "Eliminar ventas del proyecto" ON proyecto_ventas;
CREATE POLICY "Eliminar ventas del proyecto"
  ON proyecto_ventas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM comite_proyectos cp
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE cp.id = proyecto_ventas.proyecto_id
        AND cu.usuario_id = auth.uid()
        AND cu.rol IN ('lider', 'tesorero')
        AND cu.estado = 'activo'
    )
  );

-- =========================================
-- RLS (Row Level Security) - PAGOS DE VENTAS
-- =========================================
ALTER TABLE proyecto_pagos_ventas ENABLE ROW LEVEL SECURITY;

-- Política: Ver pagos de ventas
DROP POLICY IF EXISTS "Ver pagos de ventas" ON proyecto_pagos_ventas;
CREATE POLICY "Ver pagos de ventas"
  ON proyecto_pagos_ventas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proyecto_ventas pv
      INNER JOIN comite_proyectos cp ON cp.id = pv.proyecto_id
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE pv.id = proyecto_pagos_ventas.venta_id
        AND cu.usuario_id = auth.uid()
        AND cu.estado = 'activo'
    )
  );

-- Política: Registrar pagos (todos los miembros activos)
DROP POLICY IF EXISTS "Registrar pagos de ventas" ON proyecto_pagos_ventas;
CREATE POLICY "Registrar pagos de ventas"
  ON proyecto_pagos_ventas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proyecto_ventas pv
      INNER JOIN comite_proyectos cp ON cp.id = pv.proyecto_id
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE pv.id = proyecto_pagos_ventas.venta_id
        AND cu.usuario_id = auth.uid()
        AND cu.estado = 'activo'
    )
  );

-- Política: Actualizar pagos (líderes y tesoreros)
DROP POLICY IF EXISTS "Actualizar pagos de ventas" ON proyecto_pagos_ventas;
CREATE POLICY "Actualizar pagos de ventas"
  ON proyecto_pagos_ventas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM proyecto_ventas pv
      INNER JOIN comite_proyectos cp ON cp.id = pv.proyecto_id
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE pv.id = proyecto_pagos_ventas.venta_id
        AND cu.usuario_id = auth.uid()
        AND cu.rol IN ('lider', 'tesorero')
        AND cu.estado = 'activo'
    )
  );

-- Política: Eliminar pagos (líderes y tesoreros)
DROP POLICY IF EXISTS "Eliminar pagos de ventas" ON proyecto_pagos_ventas;
CREATE POLICY "Eliminar pagos de ventas"
  ON proyecto_pagos_ventas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM proyecto_ventas pv
      INNER JOIN comite_proyectos cp ON cp.id = pv.proyecto_id
      INNER JOIN comite_usuarios cu ON cu.comite_id = cp.comite_id
      WHERE pv.id = proyecto_pagos_ventas.venta_id
        AND cu.usuario_id = auth.uid()
        AND cu.rol IN ('lider', 'tesorero')
        AND cu.estado = 'activo'
    )
  );

-- =========================================
-- VISTA: Resumen de ventas por proyecto
-- =========================================
CREATE OR REPLACE VIEW vista_resumen_ventas_proyecto AS
SELECT 
  p.id as proyecto_id,
  p.nombre as proyecto_nombre,
  COUNT(DISTINCT pv.id) as total_ventas,
  COUNT(DISTINCT pv.producto_id) as productos_distintos,
  SUM(pv.cantidad) as unidades_vendidas,
  SUM(pv.valor_total) as valor_total_ventas,
  SUM(pv.monto_pagado) as total_recaudado,
  SUM(pv.saldo_pendiente) as total_pendiente,
  COUNT(DISTINCT CASE WHEN pv.estado = 'pagado' THEN pv.id END) as ventas_pagadas,
  COUNT(DISTINCT CASE WHEN pv.estado = 'pendiente' THEN pv.id END) as ventas_pendientes
FROM comite_proyectos p
LEFT JOIN proyecto_ventas pv ON pv.proyecto_id = p.id
GROUP BY p.id, p.nombre;

-- =========================================
-- COMENTARIOS
-- =========================================
COMMENT ON TABLE proyecto_productos IS 'Productos configurables que se pueden vender en proyectos del comité';
COMMENT ON TABLE proyecto_ventas IS 'Ventas de productos a compradores externos (no usuarios del sistema)';
COMMENT ON TABLE proyecto_pagos_ventas IS 'Pagos y abonos realizados sobre ventas de productos';
COMMENT ON VIEW vista_resumen_ventas_proyecto IS 'Resumen estadístico de ventas por proyecto';
