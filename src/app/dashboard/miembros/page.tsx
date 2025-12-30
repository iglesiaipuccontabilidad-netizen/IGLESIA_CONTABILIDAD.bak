import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import { MiembrosGrid } from '@/components/miembros/MiembrosGrid'
import Link from 'next/link'
import { VotoBase } from '@/types/miembros'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MiembrosPage() {
  const supabase = await createClient();

  type MiembroRow = Database['public']['Tables']['miembros']['Row'];
  type MiembrosResponse = MiembroRow & {
    votos_activos: VotoBase[] | null;
  };

  const { data: miembros, error } = await supabase
    .from('miembros')
    .select(`
      id,
      nombres,
      apellidos,
      email,
      telefono,
      estado,
      votos_activos:votos(
        id,
        estado,
        proposito,
        monto_total,
        recaudado
      )
    `)
    .order('apellidos', { ascending: true })
    .order('nombres', { ascending: true }) as unknown as { 
      data: MiembrosResponse[] | null;
      error: any;
    };

  if (error) {
    console.error('Error al cargar miembros:', error);
    return (
      <div className="p-4">
        <div className="bg-rose-50 text-rose-500 p-4 rounded-lg border border-rose-100">
          Error al cargar los miembros. Por favor, intenta de nuevo.
        </div>
      </div>
    );
  }

  if (!miembros) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg">
          No se encontraron miembros.
        </div>
      </div>
    );
  }

  const miembrosFormateados = miembros.map(miembro => ({
    id: miembro.id,
    nombres: miembro.nombres,
    apellidos: miembro.apellidos,
    email: miembro.email || '',
    telefono: miembro.telefono || '',
    estado: miembro.estado,
    votos_count: miembro.votos_activos?.length || 0
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Miembros ({miembrosFormateados.length})
          </h1>
          <p className="text-slate-500 mt-1">
            Gestiona los miembros de la iglesia y sus votos
          </p>
        </div>
        
        <Link
          href="/dashboard/miembros/nuevo"
          className="bg-gradient-to-r from-primary-500 via-primary-600 to-cyan-500 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
        >
          + Nuevo Miembro
        </Link>
      </div>

      <MiembrosGrid miembros={miembrosFormateados} />
    </div>
  );
}