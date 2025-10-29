import React, { useEffect, useState } from 'react';
import { User, Lock, ChevronDown, LogIn, LogOut, GraduationCap, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithCredentials, testDatabaseConnection } from '../lib/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from './ui/LoadingSpinner';


const LoginSection: React.FC = () => {
  const [admissionId, setAdmissionId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // load logged user from localStorage
    try {
      const raw = localStorage.getItem('loggedUser');
      if (raw) setLoggedUser(JSON.parse(raw));
    } catch (e) {
      // ignore
    }

    // listen for global auth changes so this component stays in sync
    //const aurth =get(h):
      
    const authHandler = (ev: Event) => {
      try {
        const ce = ev as CustomEvent;
        if (ce.detail) setLoggedUser(ce.detail);
        else setLoggedUser(null);
      } catch (e) {
        setLoggedUser(null);
      }
    };
    window.addEventListener('authChanged', authHandler as EventListener);

    setLoading(false);
    return () => {
      window.removeEventListener('authChanged', authHandler as EventListener);
    };
  }, []);

  const roles = [
    { value: 'student', label: 'Student', icon: GraduationCap, color: 'from-blue-500 to-blue-600' },
    { value: 'teacher', label: 'Teacher', icon: BookOpen, color: 'from-green-500 to-green-600' },
    { value: 'admin', label: 'Administrator', icon: Users, color: 'from-purple-500 to-purple-600' },
  ];


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Test database connection first
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      toast.error('Unable to connect to the database. Please try again.');
      setLoading(false);
      return;
    }

    try {
      let credentials: any = {};
      
      if (role === 'student') {
        credentials.admission_id = admissionId;
      } else if (role === 'teacher') {
        credentials.teacher_id = teacherId;
      } else if (role === 'admin') {
        // Normalize email before sending to auth: trim and lowercase
        credentials.email = email ? email.trim().toLowerCase() : email;
      }

      const { user, error } = await signInWithCredentials(credentials, password, role);

      if (error || !user) {
        const msg = typeof error === 'string' ? error : ((error as any)?.message || 'Invalid credentials. Please try again.');
        toast.error(msg);
        return;
      }

      const userState = {
        ...JSON.parse(JSON.stringify(user)), // Deep copy to prevent issues
        loggedAs: role,
      };

      localStorage.setItem('loggedUser', JSON.stringify(userState));
      setLoggedUser(userState);
      
      window.dispatchEvent(new CustomEvent('authChanged', { detail: userState }));
      
      toast.success('Welcome back!');

      if (role === 'teacher') {
        navigate('/teacher-dashboard', { state: { user: userState } });
      } else if (role === 'admin') {
        navigate('/admin-dashboard', { state: { user: userState } });
      } else {
        navigate('/student-dashboard', { state: { user: userState } });
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    localStorage.removeItem('loggedUser');
    setLoggedUser(null);
    window.dispatchEvent(new CustomEvent('authChanged', { detail: null }));
    toast.success('Logged out successfully');
    try {
      window.dispatchEvent(new CustomEvent('authChanged', { detail: null }));
    } catch (e) {
      // ignore
    }
    navigate('/');
  };

  const goToDashboard = () => {
    if (!loggedUser) return;
    if (loggedUser.loggedAs === 'teacher') {
      navigate('/teacher-dashboard', { state: { user: loggedUser } });
    } else if (loggedUser.loggedAs === 'admin') {
      navigate('/admin-dashboard', { state: { user: loggedUser } });
    } else {
      navigate('/student-dashboard', { state: { user: loggedUser } });
    }
  };

  const currentRole = roles.find(r => r.value === role);

  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-yellow-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Access Your Portal
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sign in to access your personalized dashboard and stay connected with your academic journey
          </p>
        </motion.div>

        <div className="max-w-md mx-auto">
          {loggedUser ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={goToDashboard}
              role="button"
              tabIndex={0}
              className="group bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 cursor-pointer hover:shadow-3xl transition-all duration-500 hover:scale-105"
            >
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <img 
                      src={loggedUser.profile_photo || 'data\\images\\Default.jpg'} 
                      alt="profile" 
                      className="w-16 h-20 object-cover rounded-xl border-2 border-white/50" 
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 font-medium mb-1">Welcome back</div>
                  <div className="text-xl font-bold text-gray-900 mb-1">{loggedUser.name}</div>
                  <div className="text-sm text-gray-600 mb-3">
                    {loggedUser.loggedAs === 'teacher'
                      ? `Teacher ID: ${loggedUser.teacher_id}`
                      : loggedUser.loggedAs === 'admin'
                      ? `Email: ${loggedUser.email}`
                      : `Class: ${loggedUser.class_section}`
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {loggedUser.loggedAs === 'teacher' ? 'Teacher Portal' : loggedUser.loggedAs === 'admin' ? 'Admin Portal' : 'Student Portal'}
                    </div>
                    <button
                      onClick={handleLogout}
                      title="Logout"
                      className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className={`w-20 h-20 bg-gradient-to-br ${currentRole?.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}
                >
                  {currentRole?.icon && <currentRole.icon className="w-10 h-10 text-white" />}
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h3>
                <p className="text-gray-600">Choose your role and enter your credentials</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">I am a</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        {currentRole?.icon && <currentRole.icon className="w-5 h-5 text-gray-600" />}
                        <span className="font-medium text-gray-900">{currentRole?.label}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showRoleDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showRoleDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-10 overflow-hidden"
                      >
                        {roles.map((roleOption) => (
                          <button
                            key={roleOption.value}
                            type="button"
                            onClick={() => {
                              setRole(roleOption.value);
                              setShowRoleDropdown(false);
                            }}
                            className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3"
                          >
                            <roleOption.icon className="w-5 h-5 text-gray-600" />
                            <span className="font-medium text-gray-900">{roleOption.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>

                {role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Admission ID</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={admissionId}
                          onChange={e => setAdmissionId(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                          placeholder="Enter your Admission ID"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {role === 'teacher' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Teacher ID</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={teacherId}
                          onChange={e => setTeacherId(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                          placeholder="Enter your Teacher ID"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {role === 'admin' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Email Address</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full ${loading ? 'bg-gray-400 cursor-not-allowed' : `bg-gradient-to-r ${currentRole?.color} hover:shadow-xl`} text-white py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg flex items-center justify-center space-x-2`}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Sign In</span>
                    </>
                  )}
                </motion.button>
              </form>

            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LoginSection;

