import React from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

interface StatCardProps {
  number: string | number;
  label: string;
  description: string;
  delay?: number;
  isCounter?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  number, 
  label, 
  description, 
  delay = 0,
  isCounter = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="group text-center hover:scale-105 transition-transform duration-300"
    >
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 group-hover:border-yellow-400 transition-colors duration-300 shadow-2xl">
        <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-3 group-hover:scale-110 transition-transform duration-300">
          {isCounter && typeof number === 'number' ? (
            <AnimatedCounter end={number} suffix="+" />
          ) : (
            number
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {label}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default StatCard;