'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { SearchBar } from './SearchBar';
import { MiembroCard } from './MiembroCard';

interface MiembrosGridProps {
  miembros: Array<{
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    estado: string;
    votos_count: number;
  }>;
}

export function MiembrosGrid({ miembros }: MiembrosGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const miembrosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return miembros;

    const query = searchQuery.toLowerCase().trim();
    return miembros.filter((miembro) => {
      return (
        miembro.nombres.toLowerCase().includes(query) ||
        miembro.apellidos.toLowerCase().includes(query) ||
        miembro.email.toLowerCase().includes(query) ||
        miembro.telefono.toLowerCase().includes(query)
      );
    });
  }, [miembros, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Buscar miembros..."
        />
      </div>

      <AnimatePresence mode="wait">
        {miembrosFiltrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-8"
          >
            <p className="text-slate-500">
              No se encontraron miembros que coincidan con tu búsqueda
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BentoGrid className="max-w-7xl mx-auto">
              {miembrosFiltrados.map((miembro) => (
                <BentoGridItem 
                  key={miembro.id} 
                  onClick={() => router.push(`/dashboard/miembros/${miembro.id}`)}
                >
                  <MiembroCard miembro={miembro} />
                </BentoGridItem>
              ))}
            </BentoGrid>
          </motion.div>
        )}
      </AnimatePresence>
      
      {miembrosFiltrados.length > 0 && searchQuery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-500"
        >
          Mostrando {miembrosFiltrados.length} de {miembros.length} miembros
        </motion.div>
      )}
    </div>
  );
};