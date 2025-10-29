import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Award, Clock, TrendingUp, User, Mail, Bot, Star, GraduationCap } from 'lucide-react';
import { fetchAttendance, fetchGrades, supabase } from '../lib/supabase';
import { Student } from '../lib/types';
import { ReactNode } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';
import ModernCard from './ui/ModernCard';
import AIHelper from './AIHelper';
import RatingModal from './RatingModal';
import StudentMarksView from './StudentMarksView2';
import PerformanceSummary from './ui/PerformanceSummary';
import StudentComments from './StudentComments';
import toast from 'react-hot-toast';

interface StudentData extends Student {
  class_section: ReactNode;
  loggedAs?: string;
}

const StudentDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [homework, setHomework] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestExamPercentage, setLatestExamPercentage] = useState<number>(0);
  const [latestExamType, setLatestExamType] = useState<string>('');
  const [overallPercentage, setOverallPercentage] = useState<number>(0);
  const [examsCount, setExamsCount] = useState<number>(0);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Define the exam order
  const EXAM_ORDER = ['PA-1', 'PA-2', 'Half yearly', 'PA-3', 'PA-4', 'Annual'];
  
  const getLatestExamType = (examTypes: string[]): string | null => {
    // Filter and sort exam types based on predefined order
    const validExams = examTypes.filter(type => EXAM_ORDER.includes(type));
    if (validExams.length === 0) return null;
    
    return validExams.sort((a, b) => 
      EXAM_ORDER.indexOf(b) - EXAM_ORDER.indexOf(a)
    )[0];
  };

  useEffect(() => {
  // Calculate attendance percentage
  const calculateAttendancePercentage = useCallback(async () => {
    if (!student?.id) return 0;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: attendanceData, error } = await supabase
        .from('daily_attendance')
        .select('status')
        .eq('student_id', student.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (error || !attendanceData || attendanceData.length === 0) {
        return 0;
      }

      const presentCount = attendanceData.filter(a => a.status === 'present').length +
                          (attendanceData.filter(a => a.status === 'half_day').length * 0.5);
      const percentage = Math.round((presentCount / attendanceData.length) * 100);
      return percentage;
    } catch (error) {
      console.error('Error calculating attendance:', error);
      return 0;
    }
  }, [student?.id]);

  // Get student data from route state or localStorage
  let studentData: StudentData | undefined = location.state?.user;
  
  if (!studentData) {
    try {
      const raw = localStorage.getItem('loggedUser');
      if (raw) {
        const loggedUser = JSON.parse(raw);
        if (loggedUser.loggedAs === 'student') {
          studentData = loggedUser;
        }
      }
    } catch (e) {
      console.error('Error parsing logged user:', e);
    }
  }

  if (!studentData) {
    navigate('/');
    return;
  }    setStudent(studentData);
    loadStudentData(studentData);
  }, [location.state, navigate]);

  const loadStudentData = async (studentData: StudentData) => {
    try {
      setLoading(true);

      // Load homework for student's class and section from database
      const studentClassSection = studentData.class_section || `${studentData.class_name}-${studentData.section}`;
      const { data: homeworkData } = await supabase
        .from('homework')
        .select('*')
        .eq('class_section', studentClassSection)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setHomework(homeworkData || []);


      // Load attendance (if student ID is available)
      if (studentData.id) {
        const { data: attendanceData } = await fetchAttendance(studentData.id);
        setAttendance(attendanceData || []);

        // Load grades
        const { data: gradesData } = await fetchGrades(studentData.id);
        setGrades(gradesData || []);

        // Get marks data and calculate percentages
        try {
          // Get all marks for the student
          const { data: allMarks } = await supabase
            .from('marks')
            .select('exam_type, marks_obtained, total_marks, updated_at')
            .eq('student_id', studentData.id)
            .order('updated_at', { ascending: false });

          if (allMarks && allMarks.length > 0) {
            // Get the most recently updated exam type
            const latestExam = allMarks[0].exam_type;
            
            // Calculate percentage for the latest exam type
            const latestExamMarks = allMarks.filter(mark => mark.exam_type === latestExam);
            const totalMarks = latestExamMarks.reduce((sum, mark) => sum + Number(mark.total_marks || 0), 0);
            const obtainedMarks = latestExamMarks.reduce((sum, mark) => sum + Number(mark.marks_obtained || 0), 0);
            
            if (totalMarks > 0) {
              setLatestExamType(latestExam);
              setLatestExamPercentage(Math.round((obtainedMarks / totalMarks) * 100 * 100) / 100);
            }

            // Set the total number of unique exams
            const uniqueExams = [...new Set(allMarks.map(m => m.exam_type))];
            setExamsCount(uniqueExams.length);

            // Calculate overall percentage across all marks
            const totalAll = allMarks.reduce((sum, mark) => sum + Number(mark.total_marks || 0), 0);
            const obtainedAll = allMarks.reduce((sum, mark) => sum + Number(mark.marks_obtained || 0), 0);
            
            if (totalAll > 0) {
              setOverallPercentage(Math.round((obtainedAll / totalAll) * 100 * 100) / 100);
            }
          } else {
            setLatestExamType('');
            setLatestExamPercentage(0);
            setExamsCount(0);
            setOverallPercentage(0);
          }
        } catch (e) {
          console.error('Error fetching marks data:', e);
          setLatestExamType('');
          setLatestExamPercentage(0);
          setExamsCount(0);
          setOverallPercentage(0);
        }
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Failed to load some data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendancePercentage = async () => {
    if (!student?.id) return 0;

    try {
      // Get attendance from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: attendanceData, error } = await supabase
        .from('daily_attendance')
        .select('status')
        .eq('student_id', student.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (error || !attendanceData || attendanceData.length === 0) {
        return 0;
      }

      const presentCount = attendanceData.filter(a => a.status === 'present').length +
                          (attendanceData.filter(a => a.status === 'half_day').length * 0.5);
      const percentage = Math.round((presentCount / attendanceData.length) * 100);
      return percentage;
    } catch (error) {
      console.error('Error calculating attendance:', error);
      return 0;
    }
  };

  

  // Initialize attendance percentage state at the top level
  const [attendancePercentage, setAttendancePercentage] = useState(0);

  useEffect(() => {
    const loadAttendancePercentage = async () => {
      const percentage = await calculateAttendancePercentage();
      setAttendancePercentage(percentage);
    };
    if (student?.id) {
      loadAttendancePercentage();
    }
  }, [student?.id]);

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please login to access your student dashboard</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <ModernCard className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <img
                  src={student.profile_photo || '/assest/logo.png'}
                  alt={`${student.name} profile`}
                  className="w-24 h-28 object-cover rounded-2xl border-4 border-white shadow-lg"
                />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h1>
                <div className="flex flex-col md:flex-row gap-4 text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Class: {student.class_section}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>ID: {student.admission_id}</span>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                    <div className="text-sm text-green-600 font-medium">Attendance</div>
                    <div className="text-2xl font-bold text-green-700">{attendancePercentage}%</div>
                  </div>
                  <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">Latest Score</div>
                    <div className="text-2xl font-bold text-blue-700">{latestExamPercentage}%</div>
                  </div>
                  <div className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium">Overall</div>
                    <div className="text-lg font-bold text-purple-700">{overallPercentage}%</div>
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Student Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <ModernCard className="p-6" gradient="blue">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Admission ID:</span>
                  <span className="font-medium">{student.admission_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date of Birth:</span>
                  <span className="font-medium">{student.dob}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Blood Group:</span>
                  <span className="font-medium">{student.blood_group}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Class:</span>
                  <span className="font-medium">{student.class_section}</span>
                </div>
                {student.father_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Father's Name:</span>
                    <span className="font-medium">{student.father_name}</span>
                  </div>
                )}
                {student.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{student.phone}</span>
                  </div>
                )}
              </div>
            </ModernCard>

            {/* Quick Stats */}
            <ModernCard className="p-6" gradient="yellow">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quick Stats
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{attendancePercentage}%</div>
                  <div className="text-sm text-gray-600">Attendance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{latestExamPercentage}%</div>
                  <div className="text-sm text-gray-600">Latest Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{overallPercentage}%</div>
                  <div className="text-sm text-gray-600">Overall</div>
                </div>
                           {/* Performance Summary Section */}
           

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{examsCount}</div>
                  <div className="text-sm text-gray-600">Exams</div>
                </div>
              </div>
            </ModernCard>
          </motion.div>

          {/* Right Column - Performance and Activities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Performance Summary Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ModernCard className="overflow-hidden" gradient="blue">
                <div className="px-6 py-4">
                  <PerformanceSummary 
                    overallPercentage={overallPercentage}
                    latestExamPercentage={latestExamPercentage}
                    latestExamType={latestExamType}
                  />
                </div>
              </ModernCard>
            </motion.div>

            {/* Homework Section */}
            <ModernCard className="p-6" gradient="purple">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Recent Homework
              </h2>
              {homework.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No homework assigned yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {homework.slice(0, 5).map((hw, index) => (
                    <motion.div
                      key={hw.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/50 rounded-xl p-4 border border-white/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{hw.title}</h3>
                        {hw.submission_date && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(hw.submission_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{hw.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Subject: {hw.subject}</span>
                        <span>By: {hw.teacher_name || 'Teacher'}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ModernCard>

            {/* Academic Performance Section */}
            <ModernCard className="p-6" gradient="blue">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Academic Performance
              </h2>
              <StudentMarksView
                studentId={student.id}
                admissionId={student.admission_id}
                classId={student.class_id || ''}
              />
            </ModernCard>

            {/* Teacher Comments */}
            <ModernCard className="p-6" gradient="green">
              <StudentComments
                studentId={student.id}
                viewMode="student"
              />
            </ModernCard>
          </motion.div>
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-40">
          {/* AI Helper Button */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAIHelper(true)}
            className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center group relative"
            title="AI Study Assistant"
          >
            <Bot className="w-8 h-8" />
            <span className="absolute right-full mr-4 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              AI Study Assistant
            </span>
          </motion.button>

          {/* Rating Button */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowRatingModal(true)}
            className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center group relative"
            title="Submit Rating"
          >
            <Star className="w-8 h-8" />
            <span className="absolute right-full mr-4 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Submit Rating
            </span>
          </motion.button>
        </div>
      </div>

      {/* AI Helper Modal */}
      <AnimatePresence>
        {showAIHelper && (
          <AIHelper
            studentName={student?.name || 'Student'}
            onClose={() => setShowAIHelper(false)}
          />
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && student?.id && (
          <RatingModal
            studentId={student.id}
            onClose={() => setShowRatingModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;