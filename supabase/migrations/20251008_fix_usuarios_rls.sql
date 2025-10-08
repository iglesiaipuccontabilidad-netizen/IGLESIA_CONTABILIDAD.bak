-- Eliminar políticas existentes para la tabla usuarios
drop policy if exists "Allow read access to authenticated users" on public.usuarios;
drop policy if exists "Admins can view all statuses" on public.usuarios;
drop policy if exists "Users can view their own status" on public.usuarios;

-- Crear nuevas políticas más permisivas para la tabla usuarios
create policy "Users can view all users"
  on public.usuarios
  for select
  using (true);

create policy "Users can update their own data"
  on public.usuarios
  for update
  using (auth.uid() = id);

-- Asegurarse de que RLS está habilitado
alter table public.usuarios enable row level security;