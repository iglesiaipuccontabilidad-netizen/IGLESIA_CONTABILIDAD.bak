'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ExpandableCard } from '@/components/ui/expandable-card';
import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { ActionMenu } from './ActionMenu';
import { DeleteConfirmation } from './DeleteConfirmation';
import { eliminarMiembro } from '@/app/actions/miembros';

interface MiembroCardProps {
  miembro: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    estado: string;
    votos_count: number;
  };
}

export function MiembroCard({ miembro }: MiembroCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/dashboard/miembros/${miembro.id}/editar`);
  };

  const handleDelete = async () => {
    try {
      await eliminarMiembro(miembro.id);
      toast.success('Miembro eliminado con éxito');
      router.refresh();
    } catch (error) {
      toast.error('Error al eliminar el miembro');
      console.error(error);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <ExpandableCard
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        className="p-4"
      >
        <div className="space-y-4">
          {/* Encabezado con nombre y estado */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {miembro.nombres} {miembro.apellidos}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <AnimatedTooltip content={`Estado: ${miembro.estado}`}>
                <span className={`
                  px-2 py-1 text-sm rounded-full
                  ${miembro.estado === 'activo' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'}
                `}>
                  {miembro.estado}
                </span>
              </AnimatedTooltip>
              <ActionMenu 
                onEdit={handleEdit}
                onDelete={() => setIsDeleteModalOpen(true)}
              />
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Email:</span> {miembro.email}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Teléfono:</span> {miembro.telefono}
            </p>
          </div>

          {/* Votos activos */}
          <AnimatedTooltip content="Ver detalles de votos">
            <div 
              onClick={() => router.push(`/dashboard/votos?miembro=${miembro.id}`)}
              className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
            >
              <span className="text-sm font-medium text-blue-900">Votos Activos</span>
              <span className="text-lg font-semibold text-blue-900">
                {miembro.votos_count}
              </span>
            </div>
          </AnimatedTooltip>
        </div>
      </ExpandableCard>

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        nombre={`${miembro.nombres} ${miembro.apellidos}`}
      />
    </>
  );
}