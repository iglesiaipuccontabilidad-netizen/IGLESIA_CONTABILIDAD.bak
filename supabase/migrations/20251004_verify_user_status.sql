-- Función para verificar el estado del usuario
create or replace function public.verify_user_status(user_id uuid)
returns table (
  estado text,
  rol text
) security definer
set search_path = public
language plpgsql
as $$
begin
  -- Verificar si el usuario existe y obtener su estado
  return query
  select u.estado::text, u.rol::text
  from public.usuarios u
  where u.id = user_id;
end;
$$;