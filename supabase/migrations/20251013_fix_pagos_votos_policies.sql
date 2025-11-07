-- Enable RLS
alter table public.pagos enable row level security;
alter table public.votos enable row level security;

-- Pagos policies
create policy "Allow insert pagos for admins and tesoreros"
on public.pagos
for insert
to authenticated
using (
  exists (
    select 1 from public.usuarios
    where usuarios.id = auth.uid()
    and rol in ('admin', 'tesorero')
    and estado = 'activo'
  )
);

-- Update policy for votos
create policy "Allow update votos for admins and tesoreros"
on public.votos
for update
to authenticated
using (
  exists (
    select 1 from public.usuarios
    where usuarios.id = auth.uid()
    and rol in ('admin', 'tesorero')
    and estado = 'activo'
  )
);
