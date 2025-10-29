import React from 'react'
import { motion } from 'framer-motion'

interface GradientCardProps {
  children: React.ReactNode
  className?: string
  gradient?: 'blue' | 'yellow' | 'purple' | 'green'
  hover?: boolean
}

const GradientCard: React.FC<GradientCardProps> = ({ 
  children, 
  className = '', 
  gradient = 'blue',
  hover = true 
}) => {
  const gradients = {
    blue: 'from-blue-500 via-blue-600 to-blue-700',
    yellow: 'from-yellow-400 via-yellow-500 to-yellow-600',
    purple: 'from-purple-500 via-purple-600 to-purple-700',
    green: 'from-green-500 via-green-600 to-green-700'
  }

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[gradient]} ${className}`}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

export default GradientCard