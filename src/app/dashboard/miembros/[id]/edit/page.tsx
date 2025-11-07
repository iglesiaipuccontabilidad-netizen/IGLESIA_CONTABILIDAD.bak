import { createClient } from '@/lib/supabase/server';
import { EditarMiembroForm } from '@/components/miembros/EditarMiembroForm';
import { notFound } from 'next/navigation';
import type { Miembro } from '@/types/miembros';

interface EditarMiembroPageProps {
  params: {
    id: string;
  };
}

export default async function EditarMiembroPage({ params }: EditarMiembroPageProps) {
  const supabase = await createClient();

  // Obtener los datos del miembro
  const { data: miembro, error } = await supabase
    .from('miembros')
    .select('*')
    .eq('id', params.id)
    .single() as { data: Miembro | null, error: any };

  if (error || !miembro) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Editar Miembro: {miembro.nombres} {miembro.apellidos}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Actualiza la información del miembro
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <EditarMiembroForm miembro={miembro} />
      </div>
    </div>
  );
}