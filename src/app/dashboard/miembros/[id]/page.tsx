import { createClient } from '@/lib/supabase/server';
import DetalleMiembroClient from '@/components/miembros/DetalleMiembroClient';

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DetalleMiembroPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: miembro, error } = await supabase
    .from('miembros')
    .select(`
      *,
      votos (
        id,
        proposito,
        monto_total,
        recaudado,
        estado,
        fecha_limite
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al cargar el miembro:', error);
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error al cargar los datos del miembro. Por favor, intenta de nuevo.
        </div>
      </div>
    );
  }

  if (!miembro) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg">
          No se encontró el miembro solicitado.
        </div>
      </div>
    );
  }

  return <DetalleMiembroClient miembro={miembro} />;
}