'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const BentoGridItem: React.FC<BentoGridItemProps> = ({ 
  children, 
  className = '',
  onClick 
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        bg-white rounded-xl shadow-sm border border-slate-200
        overflow-hidden transition-all duration-200
        hover:shadow-md hover:border-primary-500 hover:bg-primary-50/30
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};