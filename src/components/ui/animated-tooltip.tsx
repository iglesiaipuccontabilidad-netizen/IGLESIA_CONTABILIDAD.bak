'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedTooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`
            absolute z-10 px-3 py-2 mt-2
            text-sm text-white bg-gray-900 rounded-md
            shadow-sm whitespace-nowrap
            ${className}
          `}
        >
          {content}
          <div className="absolute -top-1 left-1/2 -ml-1 w-2 h-2 bg-gray-900 transform rotate-45" />
        </motion.div>
      )}
    </div>
  );
};