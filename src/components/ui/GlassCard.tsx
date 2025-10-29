import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'yellow';
  blur?: 'sm' | 'md' | 'lg';
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  gradient = 'blue',
  blur = 'md'
}) => {
  const gradients = {
    blue: 'from-blue-500/20 via-cyan-500/10 to-blue-600/20',
    purple: 'from-purple-500/20 via-pink-500/10 to-purple-600/20',
    pink: 'from-pink-500/20 via-rose-500/10 to-pink-600/20',
    green: 'from-green-500/20 via-emerald-500/10 to-green-600/20',
    orange: 'from-orange-500/20 via-amber-500/10 to-orange-600/20',
    yellow: 'from-yellow-400/20 via-amber-400/10 to-yellow-500/20'
  };

  const blurLevels = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg'
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-3xl bg-white/10 ${blurLevels[blur]} border border-white/20 shadow-2xl ${className}`}
      whileHover={hover ? { 
        scale: 1.02, 
        y: -8,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      } : {}}
      transition={{ 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[gradient]} opacity-60`} />
      
      {/* Animated border gradient */}
      <div className="absolute inset-0 rounded-3xl">
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${gradients[gradient]} opacity-30 blur-sm`} />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
    </motion.div>
  );
};

export default GlassCard;