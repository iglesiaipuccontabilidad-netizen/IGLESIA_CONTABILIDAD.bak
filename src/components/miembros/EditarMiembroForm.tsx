'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/hooks/useOrgRouter';
import { toast } from 'react-hot-toast';
import { updateMiembro } from '@/app/actions/miembros';
import type { Miembro, MiembroFormData } from '@/types/miembros';

interface EditarMiembroFormProps {
  miembro: Miembro;
}

export function EditarMiembroForm({ miembro }: EditarMiembroFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<MiembroFormData>({
    nombres: miembro.nombres,
    apellidos: miembro.apellidos,
    email: miembro.email || '',
    telefono: miembro.telefono || '',
    direccion: miembro.direccion || '',
    fecha_ingreso: miembro.fecha_ingreso,
    estado: miembro.estado,
    rol: miembro.rol
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateMiembro(miembro.id, formData);
      toast.success('Miembro actualizado con éxito');
      router.refresh();
      router.push(`/dashboard/miembros/${miembro.id}`);
    } catch (error) {
      console.error('Error al actualizar miembro:', error);
      toast.error('Error al actualizar el miembro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombres
          </label>
          <input
            type="text"
            required
            value={formData.nombres}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              nombres: e.target.value
            }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Apellidos
          </label>
          <input
            type="text"
            required
            value={formData.apellidos}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              apellidos: e.target.value
            }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              email: e.target.value
            }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <input
            type="tel"
            value={formData.telefono || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              telefono: e.target.value
            }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Dirección
          </label>
          <input
            type="text"
            value={formData.direccion || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              direccion: e.target.value
            }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Estado
          </label>
          <select
            value={formData.estado}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              estado: e.target.value as 'activo' | 'inactivo'
            }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rol
          </label>
          <select
            value={formData.rol}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              rol: e.target.value as 'miembro' | 'admin' | 'tesorero'
            }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="miembro">Miembro</option>
            <option value="admin">Administrador</option>
            <option value="tesorero">Tesorero</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`
            px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isLoading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}