-- =========================================
-- FUNCIÓN: obtener_balance_comite
-- Calcula el balance total de un comité sumando ingresos y restando egresos
-- =========================================
-- Fecha: 31 Diciembre 2025
-- Descripción: Función RPC para calcular balance de comité

CREATE OR REPLACE FUNCTION obtener_balance_comite(p_comite_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_ingresos NUMERIC := 0;
  v_total_egresos NUMERIC := 0;
  v_balance NUMERIC := 0;
BEGIN
  -- Calcular total de ingresos (ofrendas)
  SELECT COALESCE(SUM(monto), 0)
  INTO v_total_ingresos
  FROM comite_ofrendas
  WHERE comite_id = p_comite_id;

  -- Calcular total de egresos (gastos)
  SELECT COALESCE(SUM(monto), 0)
  INTO v_total_egresos
  FROM comite_gastos
  WHERE comite_id = p_comite_id;

  -- Calcular balance
  v_balance := v_total_ingresos - v_total_egresos;

  -- Retornar resultado como JSON
  RETURN json_build_object(
    'balance', v_balance,
    'total_ingresos', v_total_ingresos,
    'total_egresos', v_total_egresos
  );
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION obtener_balance_comite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_balance_comite(UUID) TO anon;