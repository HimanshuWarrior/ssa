import React from 'react';
import { motion } from 'framer-motion';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: 'blue' | 'yellow' | 'purple' | 'green' | 'pink';
}

const ModernCard: React.FC<ModernCardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  gradient = 'blue'
}) => {
  const gradients = {
    blue: 'from-blue-500/10 via-blue-600/5 to-transparent',
    yellow: 'from-yellow-400/10 via-yellow-500/5 to-transparent',
    purple: 'from-purple-500/10 via-purple-600/5 to-transparent',
    green: 'from-green-500/10 via-green-600/5 to-transparent',
    pink: 'from-pink-500/10 via-pink-600/5 to-transparent'
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl ${className}`}
      whileHover={hover ? { y: -5, scale: 1.02 } : {}}
      transition={{ duration: 0.3 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[gradient]} opacity-50`} />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default ModernCard;