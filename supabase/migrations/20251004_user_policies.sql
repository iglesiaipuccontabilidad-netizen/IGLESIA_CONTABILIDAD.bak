-- Habilitar RLS en la tabla usuarios
alter table public.usuarios enable row level security;

-- Política para permitir a los usuarios ver su propio estado
create policy "Users can view their own status"
  on public.usuarios
  for select
  using (auth.uid() = id);

-- Política para permitir a los administradores ver todos los estados
create policy "Admins can view all statuses"
  on public.usuarios
  for select
  using (
    auth.uid() in (
      select id from public.usuarios 
      where rol = 'admin'
    )
  );