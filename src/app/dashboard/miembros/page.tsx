import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import MemberList from '@/components/miembros/MemberList'
import { MemberCard } from '@/components/miembros/MemberCard'
import layoutStyles from '@/styles/layout.module.css'
import Link from 'next/link'

export default async function MiembrosPage() {
  const supabase = await createClient();

  // Obtener la lista de miembros con su conteo de votos activos
  const { data: miembros, error } = await (supabase as any)
    .from('miembros')
    .select(`
      *,
      votos_activos:votos!inner(
        id
      )
    `)
    .eq('votos.estado', 'activo')
    .order('apellidos', { ascending: true })
    .order('nombres', { ascending: true });

  // Puedes manejar el error aquí si lo deseas
  if (error) {
    return <div>Error al cargar los miembros: {error.message}</div>;
  }

  return (
    <>
      <div className={layoutStyles['page-header']}>
        <h1 className={layoutStyles['page-title']}>Miembros</h1>
        <Link 
          href="/dashboard/miembros/nuevo" 
          className={layoutStyles['btn-primary']}
        >
          + Nuevo Miembro
        </Link>
      </div>

      <div className={layoutStyles['members-grid']}>
        {miembros?.map((member: Database['public']['Tables']['miembros']['Row'] & {
          votos_activos: { id: string }[]
        }) => (
          <MemberCard
            key={member.id}
            {...member}
            email={member.email ?? ''}
            telefono={member.telefono ?? ''}
            cedula={member.cedula ?? ''}
          />
        ))}
      </div>
    </>
  );
}