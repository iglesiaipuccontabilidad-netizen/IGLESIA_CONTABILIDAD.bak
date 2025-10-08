-- Enable RLS
alter table auth.users enable row level security;
alter table public.usuarios enable row level security;

-- Policy for usuarios table
create policy "Allow read access to authenticated users"
on public.usuarios
for select
to authenticated
using (true);

-- Policy for auth.users table
create policy "Allow read access to own user"
on auth.users
for select
to authenticated
using (auth.uid() = id);

-- Policy for public.miembros table
create policy "Allow read access to authenticated users"
on public.miembros
for select
to authenticated
using (true);

-- Policy for public.votos table
create policy "Allow read access to authenticated users"
on public.votos
for select
to authenticated
using (true);

-- Policy for public.pagos table
create policy "Allow read access to authenticated users"
on public.pagos
for select
to authenticated
using (true);