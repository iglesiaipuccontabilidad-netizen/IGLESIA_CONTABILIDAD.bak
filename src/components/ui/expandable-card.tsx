'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const ExpandableCard: React.FC<CardProps> = ({
  children,
  expanded = false,
  onToggle,
  className = ''
}) => {
  return (
    <motion.div
      layout
      animate={{ height: expanded ? 'auto' : '16rem' }}
      className={`
        relative overflow-hidden bg-white rounded-xl
        border border-gray-200 shadow-sm
        transition-all duration-200
        ${expanded ? 'shadow-lg' : ''}
        ${className}
      `}
      onClick={onToggle}
    >
      <motion.div layout="position">
        {children}
      </motion.div>
      
      {!expanded && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
      )}
    </motion.div>
  );
};