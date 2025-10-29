import React from 'react';
import { BookOpen, Users, Award, Calendar, Bell, Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Academic Excellence',
      description: 'Comprehensive curriculum designed to nurture critical thinking and creativity with CBSE standards.',
      color: 'from-blue-500 to-blue-600',
      lightColor: 'from-blue-50 to-blue-100'
    },
    {
      icon: Users,
      title: 'Expert Faculty',
      description: 'Experienced educators dedicated to student success and personal growth with modern teaching methods.',
      color: 'from-green-500 to-green-600',
      lightColor: 'from-green-50 to-green-100'
    },
    {
      icon: Award,
      title: 'Achievement Focus',
      description: 'Celebrating student accomplishments and fostering a culture of excellence through recognition.',
      color: 'from-yellow-500 to-yellow-600',
      lightColor: 'from-yellow-50 to-yellow-100'
    },
    {
      icon: Calendar,
      title: 'Flexible Learning',
      description: 'Adaptable schedules and learning methods to fit every student\'s unique needs and pace.',
      color: 'from-orange-500 to-orange-600',
      lightColor: 'from-orange-50 to-orange-100'
    },
    {
      icon: Bell,
      title: 'Live Updates',
      description: 'Real-time notifications and announcements to keep everyone informed about important events.',
      color: 'from-cyan-500 to-cyan-600',
      lightColor: 'from-cyan-50 to-cyan-100'
    },
    {
      icon: Shield,
      title: 'Safe Environment',
      description: 'Secure and nurturing environment where students can thrive, learn, and develop confidence.',
      color: 'from-emerald-500 to-emerald-600',
      lightColor: 'from-emerald-50 to-emerald-100'
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-100/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mb-6 shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-sm">Why Choose Us</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Excellence in Every
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-green-600">
              Aspect of Education
            </span>
          </h2>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We provide a comprehensive educational experience that prepares students for success
            in an ever-changing world with modern facilities and dedicated support.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative"
            >
              <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-transparent overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.lightColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                <div className="relative z-10">
                  <motion.div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-500`}
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>

                <motion.div
                  className="absolute -bottom-2 -right-2 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <feature.icon className="w-full h-full text-gray-900" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-gradient-to-r from-blue-600 via-cyan-600 to-green-600 p-1 rounded-2xl">
            <div className="bg-white px-8 py-6 rounded-2xl">
              <p className="text-lg text-gray-700">
                Join our community of excellence and discover your true potential
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
