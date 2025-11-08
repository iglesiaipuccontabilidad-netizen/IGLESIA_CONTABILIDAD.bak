-- Eliminar políticas existentes para la tabla usuarios
drop policy if exists "Users can view all users" on public.usuarios;
drop policy if exists "Users can update their own data" on public.usuarios;
drop policy if exists "Allow read access to authenticated users" on public.usuarios;
drop policy if exists "Admins can view all statuses" on public.usuarios;
drop policy if exists "Users can view their own status" on public.usuarios;

-- Crear política que permite a usuarios autenticados leer todos los registros de usuarios
create policy "Authenticated users can view all users"
  on public.usuarios
  for select
  to authenticated
  using (true);

-- Crear política que permite a usuarios autenticados actualizar su propio registro
create policy "Users can update their own data"
  on public.usuarios
  for update
  to authenticated
  using (auth.uid() = id);

-- Crear política que permite insertar nuevos usuarios (para el registro)
create policy "Allow insert for authenticated users"
  on public.usuarios
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Asegurarse de que RLS está habilitado
alter table public.usuarios enable row level security;

-- Verificar que la tabla tiene los índices necesarios
create index if not exists idx_usuarios_id on public.usuarios(id);
create index if not exists idx_usuarios_email on public.usuarios(email);
create index if not exists idx_usuarios_estado on public.usuarios(estado);
