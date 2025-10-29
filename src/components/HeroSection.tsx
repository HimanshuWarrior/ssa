import React from 'react';
import { ArrowRight, BookOpen, Star, Heart, Lightbulb, Sparkles, GraduationCap, Users, Award, Play, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from './ui/AnimatedBackground';
import GlassCard from './ui/GlassCard';
import FloatingButton from './ui/FloatingButton';

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-sky-800 to-cyan-900 min-h-screen flex items-center">
      {/* Enhanced animated background */}
      <AnimatedBackground variant="particles" />
      
      {/* Gradient overlays for depth */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-gradient-to-br from-yellow-400/30 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-gradient-to-tr from-blue-500/30 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-green-500/15 to-emerald-500/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center min-h-screen py-20">
          {/* Left Section */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
            className="flex-1 text-center lg:text-left mb-12 lg:mb-0"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center justify-center lg:justify-start space-x-2 mb-6"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </motion.div>
              <span className="text-sm font-semibold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent uppercase tracking-wide">Since 1999 • CBSE Affiliated</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl lg:text-8xl font-bold text-white mb-8 leading-tight"
            >
              <motion.span 
                className="block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Shakti Shanti
              </motion.span>
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.8, type: "spring" }}
              >
                Academy
              </motion.span>
              <motion.span 
                className="block text-2xl lg:text-4xl font-medium bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                The Roots of Education
              </motion.span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="text-blue-100 text-xl lg:text-2xl mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light"
            >
              Nurturing young minds with knowledge, creativity, and values since 1999. 
              Join our community of 1800+ students and experience excellence in education 
              with our dedicated team of 81 expert educators.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              className="flex flex-wrap justify-center lg:justify-start gap-8 mb-8"
            >
              {[
                { number: '1800+', label: 'Students', delay: 0 },
                { number: '81', label: 'Teachers', delay: 0.1 },
                { number: '25+', label: 'Years', delay: 0.2 },
                { number: '95%', label: 'Success Rate', delay: 0.3 }
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="text-center group"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5 + stat.delay, duration: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.1, y: -5 }}
                >
                  <div className="relative">
                    <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent group-hover:from-yellow-300 group-hover:to-orange-300 transition-all duration-300">
                      {stat.number}
                    </div>
                    <div className="text-blue-200 text-sm font-medium group-hover:text-white transition-colors duration-300">
                      {stat.label}
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to="/apply-admission" 
                  className="group relative bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 px-10 py-5 rounded-3xl font-bold transition-all duration-500 flex items-center justify-center space-x-3 shadow-2xl hover:shadow-yellow-500/50 overflow-hidden"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <span className="relative z-10">Apply for Admission</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative z-10"
                  >
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </motion.div>
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to="/about" 
                  className="group relative bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-10 py-5 rounded-3xl font-bold transition-all duration-500 flex items-center justify-center space-x-3 border border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl overflow-hidden"
                >
                  {/* Ripple effect */}
                  <div className="absolute inset-0 bg-white/5 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-3xl" />
                  <span className="relative z-10">Learn More</span>
                  <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform duration-200 relative z-10" />
                </Link>
              </motion.div>
              
              {/* Video play button */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2, duration: 0.5, type: "spring" }}
              >
                <FloatingButton
                  icon={Play}
                  size="lg"
                  variant="secondary"
                  tooltip="Watch School Tour"
                  className="ml-4"
                />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Section */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.6, -0.05, 0.01, 0.99] }}
            className="flex-1 flex items-center justify-center relative"
          >
            {/* Enhanced Central Display */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 150, damping: 15 }}
              className="relative z-10"
            >
              <GlassCard 
                gradient="blue" 
                blur="lg"
                className="w-96 h-96 lg:w-[500px] lg:h-[500px] flex items-center justify-center group"
              >
                <div className="text-center p-8 relative">
                  <motion.div
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 6, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="w-40 h-40 lg:w-48 lg:h-48 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:shadow-yellow-500/50 transition-shadow duration-500"
                  >
                    <motion.div
                      animate={{ rotate: [0, -360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <GraduationCap className="w-20 h-20 lg:w-24 lg:h-24 text-white drop-shadow-lg" />
                    </motion.div>
                    
                    {/* Orbiting elements */}
                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="absolute -top-2 left-1/2 w-4 h-4 bg-white/80 rounded-full transform -translate-x-1/2" />
                      <div className="absolute top-1/2 -right-2 w-3 h-3 bg-blue-300/80 rounded-full transform -translate-y-1/2" />
                      <div className="absolute -bottom-2 left-1/2 w-4 h-4 bg-pink-300/80 rounded-full transform -translate-x-1/2" />
                      <div className="absolute top-1/2 -left-2 w-3 h-3 bg-green-300/80 rounded-full transform -translate-y-1/2" />
                    </motion.div>
                  </motion.div>
                  
                  <div className="text-white">
                    <motion.p 
                      className="font-bold text-3xl lg:text-4xl mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2, duration: 0.6 }}
                    >
                      Excellence
                    </motion.p>
                    <motion.p 
                      className="text-blue-200 text-xl font-light"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4, duration: 0.6 }}
                    >
                      in Education
                    </motion.p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Floating Achievement Icons */}
            {[
              { icon: BookOpen, position: 'top-16 left-12 lg:top-20 lg:left-16', gradient: 'blue', rotation: 12, delay: 0 },
              { icon: Star, position: 'top-32 right-16 lg:top-40 lg:right-20', gradient: 'green', rotation: -10, delay: 0.5 },
              { icon: Award, position: 'bottom-20 left-20 lg:bottom-24 lg:left-24', gradient: 'green', rotation: 15, delay: 1 },
              { icon: Users, position: 'bottom-32 right-12 lg:bottom-40 lg:right-16', gradient: 'orange', rotation: -15, delay: 1.5 },
              { icon: Heart, position: 'top-1/2 left-8 lg:left-12', gradient: 'orange', rotation: 20, delay: 2 },
              { icon: Lightbulb, position: 'top-1/2 right-8 lg:right-12', gradient: 'yellow', rotation: -20, delay: 2.5 }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0, rotate: item.rotation }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [-15, 15, -15], 
                  rotate: [item.rotation, item.rotation + 10, item.rotation] 
                }}
                transition={{ 
                  opacity: { delay: 1 + item.delay, duration: 0.5 },
                  scale: { delay: 1 + item.delay, duration: 0.5, type: "spring" },
                  y: { duration: 4 + index * 0.5, repeat: Infinity, delay: item.delay },
                  rotate: { duration: 6 + index * 0.5, repeat: Infinity, delay: item.delay }
                }}
                className={`absolute ${item.position} group cursor-pointer`}
                whileHover={{ scale: 1.2, rotate: item.rotation + 20 }}
              >
                <GlassCard 
                  gradient={item.gradient as any}
                  className="p-4 shadow-2xl group-hover:shadow-3xl transition-all duration-300"
                  style={{ transform: `rotate(${item.rotation}deg)` }}
                >
                  <item.icon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-8 h-12 border-2 border-white/40 rounded-full flex justify-center backdrop-blur-sm bg-white/10 cursor-pointer group hover:border-white/60 transition-colors duration-300"
          whileHover={{ scale: 1.1 }}
        >
          <motion.div
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-4 bg-gradient-to-b from-white/70 to-white/30 rounded-full mt-2 group-hover:from-white group-hover:to-white/50 transition-colors duration-300"
          />
        </motion.div>
        
        {/* Scroll text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 0.5 }}
          className="text-white/60 text-xs font-medium mt-2 text-center"
        >
          <ChevronDown className="w-4 h-4 mx-auto animate-bounce" />
          <span>Scroll to explore</span>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;