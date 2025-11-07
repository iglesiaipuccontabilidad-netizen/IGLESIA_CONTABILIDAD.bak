'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Buscar...' }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full max-w-xl">
      <motion.div
        className={`
          relative flex items-center w-full h-12 rounded-lg
          border transition-all duration-200 bg-white
          ${isFocused 
            ? 'border-primary-500 ring-2 ring-primary-100' 
            : 'border-slate-200 hover:border-slate-300'
          }
        `}
      >
        <div className="grid place-items-center h-full w-12">
          <Search 
            className={`w-5 h-5 ${isFocused ? 'text-primary-500' : 'text-slate-400'}`} 
          />
        </div>

        <input
          type="text"
          className="
            w-full h-full pr-4 text-sm text-slate-900 outline-none
            placeholder:text-slate-500 disabled:bg-slate-50
          "
          placeholder={placeholder}
          onChange={(e) => onSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="
                absolute -bottom-10 left-0 right-0
                text-xs text-gray-500 px-4
              "
            >
              Busca por nombre, apellido, email o teléfono
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}