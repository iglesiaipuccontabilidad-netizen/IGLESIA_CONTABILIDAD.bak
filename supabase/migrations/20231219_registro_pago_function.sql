-- Función para registrar un pago y actualizar el voto de forma atómica
create or replace function public.registrar_pago(
  p_voto_id uuid,
  p_monto numeric,
  p_fecha_pago date,
  p_metodo_pago text,
  p_nota text,
  p_registrado_por uuid,
  p_monto_total numeric
) returns json
language plpgsql
security definer
as $$
declare
  v_recaudado numeric;
  v_estado text;
  v_result json;
begin
  -- 1. Insertar el nuevo pago
  insert into public.pagos (
    voto_id,
    monto,
    fecha_pago,
    metodo_pago,
    nota,
    registrado_por
  ) values (
    p_voto_id,
    p_monto,
    p_fecha_pago,
    p_metodo_pago,
    p_nota,
    p_registrado_por
  );

  -- 2. Calcular nuevo monto recaudado
  select coalesce(sum(monto), 0)
  into v_recaudado
  from public.pagos
  where voto_id = p_voto_id;

  -- 3. Determinar nuevo estado
  v_estado := case
    when v_recaudado >= p_monto_total then 'completado'
    else 'activo'
  end;

  -- 4. Actualizar el voto
  update public.votos
  set
    recaudado = v_recaudado,
    estado = v_estado,
    updated_at = now()
  where id = p_voto_id;

  -- 5. Preparar respuesta
  v_result := json_build_object(
    'success', true,
    'recaudado', v_recaudado,
    'estado', v_estado
  );

  return v_result;
exception
  when others then
    raise exception 'Error al procesar el pago: %', SQLERRM;
end;
$$;