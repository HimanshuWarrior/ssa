import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Award, Users, Mail, Phone } from 'lucide-react';


const team = [
  {
    name: 'MR MANOJ KUMAR',
    title: 'Director',
    img: 'https://www.ssaami.ac.in/director.jpeg',
    description: 'Visionary leader with 25+ years of experience in educational administration and student development.',
    achievements: ['Educational Leadership', 'Institution Building', 'Student Mentorship']
  },
  {
    name: 'MRS KUNDAN SINGH',
    title: 'Principal',
    img: 'https://www.ssaami.ac.in/principal.jpeg',
    description: 'Dedicated educator committed to academic excellence and holistic development of students.',
    achievements: ['Academic Excellence', 'Curriculum Development', 'Faculty Leadership']
  },
];

const TeamSection: React.FC = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 pt-24 pb-20">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <Users className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Meet Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Leadership Team
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Dedicated leaders who guide our institution with vision, experience, and unwavering 
            commitment to educational excellence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.2 }}
              className="group"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-500 hover:scale-105">
                {/* Image Section */}
                <div className="relative h-80 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 z-10"></div>
                  <img 
                    src={member.img} 
                    alt={member.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 z-20">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      <Award className="w-4 h-4" />
                      {member.title}
                    </div>
                  </div>

                  <p className="text-gray-600 text-center mb-6 leading-relaxed">
                    {member.description}
                  </p>

                  {/* Achievements */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Key Expertise</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {member.achievements.map((achievement, i) => (
                        <span
                          key={i}
                          className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200"
                        >
                          {achievement}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex justify-center gap-4">
                    <button className="w-10 h-10 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 transition-colors duration-300">
                      <Mail className="w-4 h-4" />
                    </button>
                    <button className="w-10 h-10 bg-green-50 hover:bg-green-100 rounded-xl flex items-center justify-center text-green-600 transition-colors duration-300">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-white max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Our Commitment</h3>
            <p className="text-blue-100 text-lg leading-relaxed max-w-2xl mx-auto">
              Under the guidance of our experienced leadership team, Shakti Shanti Academy continues 
              to set new standards in education, ensuring every student receives the best possible 
              foundation for their future success.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">25+</div>
                <div className="text-blue-200">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">1800+</div>
                <div className="text-blue-200">Students Guided</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">95%</div>
                <div className="text-blue-200">Success Rate</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TeamSection;
