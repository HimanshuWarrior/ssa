import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import StudentComments from './StudentComments';
import LoadingSpinner from './ui/LoadingSpinner';

interface Student {
  id: string;
  admission_id: string;
  name: string;
  class_section: string;
}

interface CommentsManagementProps {
  userRole: 'teacher' | 'admin';
  userId: string;
  teacherClassSections?: string[];
}

const CommentsManagement: React.FC<CommentsManagementProps> = ({
  userRole,
  userId,
  teacherClassSections = []
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load students only once when component mounts
  useEffect(() => {
    let isMounted = true;

    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let query = supabase
          .from('students')
          .select('id, admission_id, name, class_section')
          .order('name');

        if (userRole === 'teacher' && teacherClassSections.length > 0) {
          query = query.in('class_section', teacherClassSections);
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) throw supabaseError;

        if (isMounted) {
          setStudents(data || []);
          setFilteredStudents(data || []);
        }
      } catch (err: any) {
        console.error('Error loading students:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load students');
          toast.error('Failed to load students');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  // Filter students when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.class_section.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Student Comments
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No students found</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedStudent?.id === student.id
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="font-semibold">{student.name}</div>
                    <div className={`text-sm ${
                      selectedStudent?.id === student.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {student.admission_id} • {student.class_section}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.admission_id} • {selectedStudent.class_section}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <StudentComments
                studentId={selectedStudent.id}
                viewMode="teacher-admin"
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                Select a student to view and add comments
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsManagement;