import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  School,
  ClipboardCheck,
  MessageCircle,
  CheckCircle2,
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar
} from 'lucide-react';

const themeYellow = '#fcd116';
const themeBlue = '#2563eb';

const admissionSteps = [
  {
    label: 'Fill Application Form',
    icon: FileText,
    desc: 'Complete the online application form with your details',
    color: 'from-blue-500 to-blue-600'
  },
  {
    label: 'Visit School',
    icon: School,
    desc: 'Schedule a visit to explore our campus and facilities',
    color: 'from-green-500 to-green-600'
  },
  {
    label: 'Entrance Test',
    icon: ClipboardCheck,
    desc: 'Appear for the entrance assessment',
    color: 'from-orange-500 to-orange-600'
  },
  {
    label: 'Interview',
    icon: MessageCircle,
    desc: 'Meet with our admission committee',
    color: 'from-purple-500 to-purple-600'
  },
  {
    label: 'Admission Confirmation',
    icon: CheckCircle2,
    desc: 'Receive your admission confirmation',
    color: 'from-pink-500 to-pink-600'
  },
];

const ApplyAdmission: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', grade: '', dob: '', parentName: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <section className="pt-32 pb-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-2xl"
            >
              <GraduationCap className="w-12 h-12 text-white" />
            </motion.div>
          </div>
          <h2 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Apply for Admission
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Join our community of learners and embark on an exciting educational journey with us.
          </p>
        </motion.div>

        {!formSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">Application Form</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Student Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      required
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Parent/Guardian Name
                    </label>
                    <input
                      type="text"
                      name="parentName"
                      value={form.parentName}
                      onChange={handleChange}
                      placeholder="Enter parent name"
                      required
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 XXXXXXXXXX"
                      required
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      required
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Grade Applying For
                    </label>
                    <select
                      name="grade"
                      value={form.grade}
                      onChange={handleChange}
                      required
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    >
                      <option value="">Select Grade</option>
                      <option value="Nursery">Nursery</option>
                      <option value="LKG">LKG</option>
                      <option value="UKG">UKG</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={`Class ${i + 1}`}>
                          Class {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Submit Application
                </motion.button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-3 text-gray-900">Application Submitted Successfully!</h3>
                <p className="text-gray-600 text-lg">
                  Thank you for your interest. Please follow the admission process steps below.
                </p>
              </div>

              <div className="space-y-6">
                {admissionSteps.map((step, idx) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="relative"
                  >
                    <div className={`flex items-start gap-6 p-6 rounded-2xl border-2 transition-all duration-300 ${
                      idx === 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}>
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : `bg-gradient-to-r ${step.color}`
                      }`}>
                        {idx === 0 ? (
                          <CheckCircle2 className="w-7 h-7 text-white" />
                        ) : (
                          <step.icon className="w-7 h-7 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                            idx === 0
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}>
                            {idx + 1}
                          </span>
                          <h4 className="text-xl font-bold text-gray-900">{step.label}</h4>
                        </div>
                        <p className="text-gray-600">{step.desc}</p>
                      </div>
                    </div>
                    {idx < admissionSteps.length - 1 && (
                      <div className="ml-12 h-8 w-0.5 bg-gradient-to-b from-gray-300 to-transparent" />
                    )}
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-yellow-50 rounded-2xl border-2 border-blue-100"
              >
                <h4 className="text-lg font-bold text-gray-900 mb-2">What's Next?</h4>
                <p className="text-gray-700">
                  Our admissions team will contact you within 2-3 business days to schedule your school visit.
                  Please check your email regularly for updates.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ApplyAdmission;
