import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Subject, Student } from '../lib/types';
import LoadingSpinner from './ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { Search, Save, User, BookOpen, Award, TrendingUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface MarksManagementProps {
  userRole: 'admin' | 'teacher';
  userId: string;
  teacherId?: string;
}

const EXAM_TYPES = ['PA1', 'PA2', 'Half Yearly', 'PA3', 'PA4', 'Annual'] as const;
type ExamType = typeof EXAM_TYPES[number];

interface SubjectMark {
  subjectId: string;
  subjectName: string;
  marksObtained: number;
  remarks: string;
  markId?: string;
  totalMarks?: number;
}

const MarksManagement: React.FC<MarksManagementProps> = ({ userRole, userId, teacherId }) => {
  void useAuth();
  const [loading, setLoading] = useState(false);
  const [admissionId, setAdmissionId] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamType>('PA1');
  const [subjectMarks, setSubjectMarks] = useState<SubjectMark[]>([]);
  const [saving, setSaving] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState<{classIds: string[], subjectIds: string[], data: Array<{class_section: string, subject: string}>}>({
    classIds: [],
    subjectIds: [],
    data: []
  });

  useEffect(() => {
    // Simple check - just verify we have user data in localStorage
    const storedUser = localStorage.getItem('loggedUser');
    if (!storedUser) {
      console.log('No user logged in');
    }
  }, []);

  useEffect(() => {
    if (userRole === 'teacher' && teacherId) {
      loadTeacherAssignments();
    }
  }, [userRole, teacherId]);

  const loadTeacherAssignments = async () => {
    if (!teacherId) return;

    try {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('teacher_id', teacherId)
        .maybeSingle();

      if (teacherError || !teacherData) {
        console.error('Error finding teacher:', teacherError);
        return;
      }

      // First get teacher's class sections and subject names
      const { data: assignmentData, error } = await supabase
        .from('teacher_class_sections')
        .select('class_section, subject')
        .eq('teacher_id', teacherData.id);

      if (error) throw error;

      if (assignmentData) {
        // Then get the subjects data to map names to IDs
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name')
          .order('name');

        if (subjectsError) {
          console.error('Error fetching subjects:', subjectsError);
          return;
        }

        // Create a map of subject names to IDs
        const subjectNameToId = Object.fromEntries(
          (subjectsData || []).map(s => [s.name, s.id])
        );

        const classSections = [...new Set(assignmentData.map(d => d.class_section))];
        const subjectNames = [...new Set(assignmentData.map(d => d.subject))];
        
        setTeacherAssignments({
          classIds: classSections,
          subjectIds: subjectNames.map(name => subjectNameToId[name]).filter(Boolean),
          data: assignmentData.map(d => ({
            class_section: d.class_section,
            subject: d.subject
          }))
        });
      }
    } catch (error: any) {
      console.error('Error loading teacher assignments:', error);
    }
  };

  // Helper: robust lookup for classes by class_section string
  const findClassBySection = async (rawSection: string) => {
    const section = (rawSection || '').trim();
    if (!section) return null;

    try {
      // 1) Try exact match first (maybeSingle)
      const singleRes = await supabase
        .from('classes')
        .select('id, class_section')
        .eq('class_section', section)
        .maybeSingle();

      if (singleRes.data && singleRes.data.id) return singleRes.data;

      // Helper to run ilike and return first result if any
      const doIlikeFirst = async (pattern: string) => {
        const arrayRes = await supabase
          .from('classes')
          .select('id, class_section')
          .ilike('class_section', pattern)
          .limit(1);
        if (arrayRes.data && Array.isArray(arrayRes.data) && arrayRes.data.length > 0) return arrayRes.data[0];
        return null;
      };

      // 2) Try case-insensitive exact match
      let found = await doIlikeFirst(section);
      if (found) return found;

      // 3) Try common alternate formats (spaces <-> dashes)
      const altDash = section.replace(/\s+/g, '-');
      if (altDash !== section) {
        found = await doIlikeFirst(altDash);
        if (found) return found;
      }

      const altSpace = section.replace(/-/g, ' ');
      if (altSpace !== section) {
        found = await doIlikeFirst(altSpace);
        if (found) return found;
      }

      // 4) Try a contains match as a last resort
      found = await doIlikeFirst(`%${section}%`);
      if (found) return found;

      return null;
    } catch (err) {
      console.error('Error finding class by section', section, err);
      return null;
    }
  };

  const searchStudent = async () => {
    if (!admissionId.trim()) {
      toast.error('Please enter an admission ID');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('admission_id', admissionId.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('No student found with this admission ID');
        setStudent(null);
        setAvailableSubjects([]);
        setSubjectMarks([]);
        return;
      }

      if (!data.class_id) {
        // Ensure proper class section format (e.g., "1-A")
        const classSection = data.class_name.includes('-') ?
          data.class_name :
          `${data.class_name}-${data.section}`;

        // Use the helper that tries multiple matching strategies
        const classData = await findClassBySection(classSection);

        if (classData && classData.id) {
          await supabase
            .from('students')
            .update({ class_id: classData.id })
            .eq('id', data.id);
          data.class_id = classData.id;
        } else {
          console.warn('Could not resolve class section for student:', classSection);
        }
      }

      // Use the class_name directly if it already includes the section
      const studentClassSection = data.class_name.includes('-') ? 
        data.class_name : 
        `${data.class_name}-${data.section}`;
      if (userRole === 'teacher' && teacherAssignments.classIds.length > 0 && !teacherAssignments.classIds.includes(studentClassSection)) {
        toast.error('You do not have permission to manage marks for this student');
        setStudent(null);
        setAvailableSubjects([]);
        setSubjectMarks([]);
        return;
      }

      setStudent(data);
      await loadSubjectsForStudent(data);
      await loadMarksForStudent(data.id, selectedExam, data.class_name);

    } catch (error: any) {
      toast.error(error.message || 'Error searching for student');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjectsForStudent = async (studentData: Student) => {
    try {
      // Debug logging
      // Check if class_name is empty
      if (!studentData.class_name) {
        toast.error('Student does not have a class assigned. Please update the student\'s class information first.');
        console.log('Student missing class:', studentData);
        return;
      }

      // Extract class number from the class name
      const classNumberPart = studentData.class_name.split('-')[0];
      const classNumber = parseClassNumber(classNumberPart);
      
      if (isNaN(classNumber)) {
        toast.error('Invalid class format. Expected format: "1-A", "2-B", etc. Got: ' + studentData.class_name);
        return;
      }

      let { data: subjects, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) throw error;

      // Filter subjects based on class number
      subjects = (subjects || []).filter(subject => {
        const fromClass = subject.applicable_from_class ?? 1;
        const toClass = subject.applicable_to_class ?? 12;
        return classNumber >= fromClass && classNumber <= toClass;
      });

      if (userRole === 'teacher' && teacherAssignments.data.length > 0) {
        const studentClassSection = `${studentData.class_name}-${studentData.section}`;
        console.log('Checking subjects for class section:', studentClassSection);
        
        // Get all subject IDs for this teacher and class section
        const { data: teacherSubjectsData } = await supabase
          .from('teacher_class_sections')
          .select(`
            id,
            class_section,
            subject
          `)
          .eq('class_section', studentClassSection);
        
        if (!teacherSubjectsData) {
          console.log('No teacher subjects found for class section:', studentClassSection);
          subjects = [];
          return;
        }
        
        // Log for debugging
        console.log('Teacher subjects data:', teacherSubjectsData);
        
        // Map subject names from teacher assignments to subject records
        subjects = subjects.filter(subject => 
          teacherSubjectsData.some(ts => 
            ts.subject === subject.name || ts.subject === subject.code
          )
        );
        
        console.log('Filtered subjects:', subjects);
      }

      setAvailableSubjects(subjects);

    } catch (error: any) {
      console.error('Error loading subjects:', error);
      toast.error('Error loading subjects');
    }
  };

  const parseClassNumber = (className: string | undefined | null) => {
    if (!className) return NaN;
    const n = parseInt(String(className), 10);
    if (!isNaN(n)) return n;
    const s = String(className).trim().toUpperCase();
    // basic roman numerals common for classes
    const roman: Record<string, number> = {
      I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12
    };
    return roman[s] ?? NaN;
  };

  const getMaxMarksFor = (className: string | undefined | null, examType: ExamType) => {
    // keep Half Yearly and Annual as 100
    if (examType === 'Half Yearly' || examType === 'Annual') return 100;
    const classNum = parseClassNumber(className);
    if (!isNaN(classNum)) {
      if (classNum >= 9) return 40; // classes 9 & 10
      if (classNum >= 1 && classNum <= 8) return 30; // classes 1-8
    }
    // default fallback
    return 100;
  };

  const loadMarksForStudent = async (studentId: string, examType: ExamType, studentClassName?: string) => {
    try {
      const { data, error } = await supabase
        .from('marks')
        .select(`
          id,
          subject_id,
          marks_obtained,
          remarks,
          total_marks,
          subject:subjects(id, name)
        `)
        .eq('student_id', studentId)
        .eq('exam_type', examType);

      if (error) throw error;

      const marksMap = new Map(
        data?.map(mark => [
          mark.subject_id,
          {
            subjectId: mark.subject_id,
            subjectName: (mark.subject as any)?.name || '',
            marksObtained: mark.marks_obtained,
            remarks: mark.remarks || '',
            markId: mark.id,
            totalMarks: mark.total_marks || undefined
          }
        ])
      );

      const classNameForCalc = studentClassName ?? student?.class_name;
      const defaultMax = getMaxMarksFor(classNameForCalc, examType);

      // Validate and map subjects
      const allSubjectMarks = availableSubjects
        .filter(subject => {
          // Ensure we have a valid UUID for the subject
          if (!subject.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(subject.id)) {
            console.error('Invalid subject ID found:', subject);
            return false;
          }
          return true;
        })
        .map(subject => ({
          subjectId: subject.id,
          subjectName: subject.name,
          marksObtained: marksMap.get(subject.id)?.marksObtained ?? 0,
          remarks: marksMap.get(subject.id)?.remarks || '',
          markId: marksMap.get(subject.id)?.markId,
          totalMarks: marksMap.get(subject.id)?.totalMarks ?? defaultMax
        }));

      setSubjectMarks(allSubjectMarks);

    } catch (error: any) {
      console.error('Error loading marks:', error);
    }
  };

  useEffect(() => {
    if (student && availableSubjects.length > 0) {
      loadMarksForStudent(student.id, selectedExam);
    }
  }, [selectedExam, availableSubjects]);

  const updateSubjectMark = (subjectId: string, field: 'marksObtained' | 'remarks', value: string) => {
    setSubjectMarks(prev =>
      prev.map(mark => {
        if (mark.subjectId !== subjectId) return mark;
        if (field === 'marksObtained') {
          const maxForMark = mark.totalMarks ?? getMaxMarksFor(student?.class_name, selectedExam);
          const num = Math.max(0, Number(value) || 0);
          const clamped = Math.min(maxForMark, num);
          return { ...mark, marksObtained: clamped };
        }
        return { ...mark, [field]: value };
      })
    );
  };

  const saveMarks = async () => {
    if (!student) return;

    try {
      setSaving(true);

      // Get user from localStorage
      const storedUser = localStorage.getItem('loggedUser');
      if (!storedUser) {
        throw new Error('Please log in to save marks.');
      }

      const loggedUser = JSON.parse(storedUser);
      console.log('Logged user:', loggedUser);

      // Get teacher record for the logged in user
      let teacherRecordId = userId;

      if (userRole === 'teacher') {
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('id, email, teacher_id')
          .eq('email', loggedUser.email)
          .maybeSingle();

        if (teacherError) {
          console.error('Error fetching teacher:', teacherError);
        }

        if (teacherData) {
          teacherRecordId = teacherData.id;
          console.log('Teacher record found:', teacherData);
        }
      }

      for (const mark of subjectMarks) {
        console.log('Processing mark:', {
          subjectId: mark.subjectId,
          subjectName: mark.subjectName,
          marksObtained: mark.marksObtained
        });

        const now = new Date().toISOString();
        const maxForThis = mark.totalMarks ?? getMaxMarksFor(student?.class_name, selectedExam);

        if (mark.markId) {
          const { data: oldMark } = await supabase
            .from('marks')
            .select('marks_obtained')
            .eq('id', mark.markId)
            .maybeSingle();

          if (oldMark && oldMark.marks_obtained !== mark.marksObtained) {
            await supabase.from('marks_history').insert({
              mark_id: mark.markId,
              student_id: student.id,
              subject_id: mark.subjectId,
              exam_type: selectedExam,
              old_marks: oldMark.marks_obtained,
              new_marks: mark.marksObtained,
              updated_by: teacherRecordId,
              created_at: now
            });
          }

          const { error: updateError } = await supabase
            .from('marks')
            .update({
              marks_obtained: mark.marksObtained,
              total_marks: maxForThis,
              // Include subject name to satisfy triggers/functions that expect a `subject` field
              subject: mark.subjectName,
              remarks: mark.remarks,
              updated_by: teacherRecordId,
              updated_at: now
            })
            .eq('id', mark.markId);

          if (updateError) throw updateError;
        } else {
          // First, ensure we have a valid class_id
          if (!student.class_id) {
            const classSection = student.class_name.includes('-') ?
              student.class_name :
              `${student.class_name}-${student.section}`;
            console.log('Fetching class_id for class section:', classSection);

            const classData = await findClassBySection(classSection);

            if (!classData?.id) {
              throw new Error(`No class found for ${classSection}. Please ensure the class exists in the database.`);
            }

            // Update student's class_id
            await supabase
              .from('students')
              .update({ class_id: classData.id })
              .eq('id', student.id);

            student.class_id = classData.id;
          }

          // Validate subject_id is a valid UUID
          if (!mark.subjectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(mark.subjectId)) {
            console.error('Invalid subject ID:', mark.subjectId);
            const subject = availableSubjects.find(s => s.name === mark.subjectName);
            if (!subject) {
              throw new Error(`Could not find valid subject ID for ${mark.subjectName}`);
            }
            mark.subjectId = subject.id;
          }

          // Log the final data being sent
          const insertData = {
            student_id: student.id,
            class_id: student.class_id,
            subject_id: mark.subjectId,
            // Include subject name (text) because DB trigger/function expects NEW.subject
            subject: mark.subjectName,
            exam_type: selectedExam,
            marks_obtained: mark.marksObtained,
            total_marks: maxForThis,
            remarks: mark.remarks || '',
            created_by: teacherRecordId,
            updated_by: teacherRecordId,
            created_at: now,
            updated_at: now
          };

          console.log('Inserting mark with data:', insertData);

          const { error: insertError } = await supabase
            .from('marks')
            .insert(insertData);

          if (insertError) throw insertError;
        }
      }

      toast.success('Marks saved successfully');
      await loadMarksForStudent(student.id, selectedExam);

    } catch (error: any) {
      console.error('Error saving marks:', error);
      toast.error(error.message || 'Error saving marks');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchStudent();
    }
  };

  const getGradeColor = (marks: number) => {
    if (marks >= 90) return 'text-green-600 bg-green-50';
    if (marks >= 75) return 'text-blue-600 bg-blue-50';
    if (marks >= 60) return 'text-yellow-600 bg-yellow-50';
    if (marks >= 45) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const calculateOverallPercentage = () => {
    if (subjectMarks.length === 0) return 0;
    const totalObtained = subjectMarks.reduce((sum, mark) => sum + (mark.marksObtained || 0), 0);
    const totalPossible = subjectMarks.reduce((sum, mark) => sum + (mark.totalMarks ?? getMaxMarksFor(student?.class_name, selectedExam)), 0);
    if (totalPossible === 0) return 0;
    return Math.round((totalObtained / totalPossible) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marks Management</h1>
              <p className="text-gray-600">Manage student marks and performance</p>
            </div>
          </div>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Search Student</h2>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={admissionId}
                onChange={(e) => setAdmissionId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter Admission ID and press Enter"
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <button
              onClick={searchStudent}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none flex items-center gap-2 font-semibold"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {student && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Student Info Card */}
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{student.name}</h2>
                      <p className="text-blue-100">Admission ID: {student.admission_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{student.class_name}</div>
                    <div className="text-blue-100">Section {student.section}</div>
                  </div>
                </div>

                {subjectMarks.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5" />
                        <span className="text-sm text-blue-100">Overall</span>
                      </div>
                      <div className="text-3xl font-bold">{calculateOverallPercentage()}%</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5" />
                        <span className="text-sm text-blue-100">Subjects</span>
                      </div>
                      <div className="text-3xl font-bold">{subjectMarks.length}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm text-blue-100">Exam Type</span>
                      </div>
                      <div className="text-xl font-bold">{selectedExam}</div>
                    </div>
                  </div>
                )}
              </div>

              {availableSubjects.length > 0 && (
                <>
                  {/* Exam Selection */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Select Exam Type
                    </label>
                    <div className="grid grid-cols-6 gap-3">
                      {EXAM_TYPES.map(exam => (
                        <button
                          key={exam}
                          onClick={() => setSelectedExam(exam)}
                          className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                            selectedExam === exam
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg transform scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {exam}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Marks Entry Cards */}
                  <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Subject-wise Marks</h3>
                      <div className="text-sm text-gray-500">
                        {student ? `Default max: ${getMaxMarksFor(student.class_name, selectedExam)} (Half Yearly & Annual remain 100)` : 'Marks max depends on class and exam'}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {subjectMarks.map((mark, index) => (
                        <motion.div
                          key={mark.subjectId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border-2 border-gray-100 hover:border-blue-200 transition-all"
                        >
                          <div className="grid grid-cols-12 gap-6 items-center">
                            <div className="col-span-3">
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const totalForMark = mark.totalMarks ?? getMaxMarksFor(student?.class_name, selectedExam);
                                  const pct = totalForMark > 0 ? Math.round((mark.marksObtained / totalForMark) * 100) : 0;
                                  return (
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getGradeColor(pct)}`}>
                                      <BookOpen className="w-6 h-6" />
                                    </div>
                                  );
                                })()}
                                <div>
                                  <div className="font-semibold text-gray-900">{mark.subjectName}</div>
                                  {(() => {
                                    const totalForMark = mark.totalMarks ?? getMaxMarksFor(student?.class_name, selectedExam);
                                    const pct = totalForMark > 0 ? Math.round((mark.marksObtained / totalForMark) * 100) : 0;
                                    return (
                                      <div className={`text-sm font-medium ${getGradeColor(pct)}`}>
                                        {mark.marksObtained}/{totalForMark} ({pct}%)
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            <div className="col-span-3">
                              <label className="block text-xs font-medium text-gray-600 mb-2">Marks Obtained</label>
                              <div className="relative">
                                {(() => {
                                  const totalForMark = mark.totalMarks ?? getMaxMarksFor(student?.class_name, selectedExam);
                                  return (
                                    <>
                                      <input
                                        type="number"
                                        min="0"
                                        max={totalForMark}
                                        value={mark.marksObtained}
                                        onChange={(e) => updateSubjectMark(mark.subjectId, 'marksObtained', e.target.value)}
                                        className="w-full px-4 py-3 text-lg font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                      />
                                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                        /{totalForMark}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>

                            <div className="col-span-6">
                              <label className="block text-xs font-medium text-gray-600 mb-2">Remarks (Optional)</label>
                              <input
                                type="text"
                                value={mark.remarks}
                                onChange={(e) => updateSubjectMark(mark.subjectId, 'remarks', e.target.value)}
                                placeholder="Add performance remarks..."
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Save Button */}
                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={saveMarks}
                        disabled={saving}
                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none flex items-center gap-3 font-semibold text-lg"
                      >
                        {saving ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Saving Marks...
                          </>
                        ) : (
                          <>
                            <Save className="w-6 h-6" />
                            Save All Marks
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* No subjects message */}
              {availableSubjects.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100"
                >
                  <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Subjects Available</h3>
                  <p className="text-gray-600">
                    {userRole === 'teacher'
                      ? 'You do not have permission to manage marks for this student\'s subjects'
                      : 'No subjects are configured for this class level'}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial state */}
        {!student && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Search for a Student</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter a student's admission ID above to view and manage their marks for different subjects and exams
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MarksManagement;
