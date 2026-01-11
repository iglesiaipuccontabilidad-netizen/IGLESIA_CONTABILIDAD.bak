-- =========================================
-- FIX: Actualizar obtener_balance_comite para incluir pagos de ventas
-- =========================================
-- Fecha: 10 Enero 2026
-- Problema: La función solo contaba ofrendas, no los pagos de ventas de proyectos
-- Solución: Sumar también los pagos registrados en proyecto_pagos_ventas

CREATE OR REPLACE FUNCTION obtener_balance_comite(p_comite_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_ingresos NUMERIC := 0;
  v_total_egresos NUMERIC := 0;
  v_balance NUMERIC := 0;
  v_ofrendas NUMERIC := 0;
  v_pagos_ventas NUMERIC := 0;
BEGIN
  -- Calcular total de ofrendas
  SELECT COALESCE(SUM(monto), 0)
  INTO v_ofrendas
  FROM comite_ofrendas
  WHERE comite_id = p_comite_id;

  -- Calcular total de pagos de ventas de proyectos del comité
  SELECT COALESCE(SUM(ppv.monto), 0)
  INTO v_pagos_ventas
  FROM proyecto_pagos_ventas ppv
  INNER JOIN proyecto_ventas pv ON pv.id = ppv.venta_id
  INNER JOIN comite_proyectos cp ON cp.id = pv.proyecto_id
  WHERE cp.comite_id = p_comite_id;

  -- Total de ingresos = ofrendas + pagos de ventas
  v_total_ingresos := v_ofrendas + v_pagos_ventas;

  -- Calcular total de egresos (gastos)
  SELECT COALESCE(SUM(monto), 0)
  INTO v_total_egresos
  FROM comite_gastos
  WHERE comite_id = p_comite_id;

  -- Calcular balance
  v_balance := v_total_ingresos - v_total_egresos;

  -- Retornar resultado como JSON con desglose
  RETURN json_build_object(
    'balance', v_balance,
    'total_ingresos', v_total_ingresos,
    'total_egresos', v_total_egresos,
    'ingresos_ofrendas', v_ofrendas,
    'ingresos_ventas', v_pagos_ventas
  );
END;
$$;

-- Comentarios para documentación
COMMENT ON FUNCTION obtener_balance_comite(UUID) IS 
'Calcula el balance de un comité sumando ofrendas y pagos de ventas de proyectos como ingresos, y restando los gastos.';
