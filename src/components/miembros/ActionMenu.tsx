'use client';

import React from 'react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function ActionMenu({ onEdit, onDelete }: ActionMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuVariants = {
    closed: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    },
    open: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Más acciones"
      >
        <MoreVertical className="w-5 h-5 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="absolute right-0 mt-2 z-20 w-48 py-2 bg-white rounded-lg shadow-lg border border-gray-200"
          >
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Editar miembro
            </button>
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar miembro
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}