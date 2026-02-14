import React from 'react';
import { motion } from 'framer-motion';

interface DraggableUIButtonProps {
  id: string;
  pos: { x: number, y: number };
  isDevMode: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  whileHover?: any;
  whileTap?: any;
  title?: string;
}

export const DraggableUIButton: React.FC<DraggableUIButtonProps> = ({
  id,
  pos,
  isDevMode,
  children,
  onClick,
  className,
  disabled,
  whileHover,
  whileTap,
  title
}) => {
  return (
    <motion.div
      // Removed drag props
      animate={{ x: pos.x, y: pos.y }}
      transition={{ duration: 0.2, ease: "easeOut" }} // Smooth transition for panel updates
      style={{ position: 'relative' }} 
      
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? undefined : whileHover}
      whileTap={disabled ? undefined : whileTap}
      className={`${className} ${disabled ? 'pointer-events-none' : ''}`}
      title={title}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      {/* Dev Mode Selection Indicator Overlay */}
      {isDevMode && (
         <div className="absolute inset-0 ring-1 ring-cyan-500/50 rounded-lg pointer-events-none z-[100]"></div>
      )}
      {children}
    </motion.div>
  );
};
