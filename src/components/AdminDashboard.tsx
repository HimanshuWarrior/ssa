import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Image as ImageIcon, Bell, LogOut, Plus, Trash2, Eye, EyeOff, X, GraduationCap, Edit3 } from 'lucide-react';
import { supabase, insertWithPassword } from '../lib/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from './ui/LoadingSpinner';
import { EXAM_TYPES, SUBJECT_MAPPINGS } from '../lib/subjects';
import MarksManagement from './MarksManagement';
import EditUserForm from './ui/EditUserForm';
// CommentsManagement removed for admin (no admin comment feature)
import StudentFilterSort from './ui/StudentFilterSort';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'gallery' | 'notices' | 'marks'>('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminData = location.state?.user || JSON.parse(localStorage.getItem('loggedUser') || 'null');
    if (!adminData || adminData.loggedAs !== 'admin') {
      toast.error('Please login as administrator');
      navigate('/');
      return;
    }
    setLoading(false);
    // Only update admin state if it's different
    setAdmin((prevAdmin: any) => {
      if (!prevAdmin || prevAdmin.id !== adminData.id) {
        return adminData;
      }
      return prevAdmin;
    });
  }, [location.state?.user]);

  const handleLogout = () => {
    localStorage.removeItem('loggedUser');
    window.dispatchEvent(new CustomEvent('authChanged', { detail: null }));
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administrator Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {admin?.name}</p>
            </div>
<button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </motion.div>

        <div className="flex gap-4 mb-6">
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'users' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            <Users className="w-5 h-5" />
            Manage Users
          </button>
          <button onClick={() => setActiveTab('gallery')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'gallery' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            <ImageIcon className="w-5 h-5" />
            Gallery
          </button>
          <button onClick={() => setActiveTab('notices')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'notices' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            <Bell className="w-5 h-5" />
            Notices
          </button>
          <button onClick={() => setActiveTab('marks')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'marks' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            <GraduationCap className="w-5 h-5" />
            Marks Management
          </button>
          {/* Comments tab removed for admin */}
        </div>

        <motion.div 
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl shadow-xl p-6"
        >
          {activeTab === 'users' && <UsersManagement adminId={admin?.id} />}
          {activeTab === 'gallery' && <GalleryManagement adminId={admin?.id} />}
          {activeTab === 'notices' && <NoticesManagement adminId={admin?.id} />}
          {activeTab === 'marks' && <MarksManagement userRole="admin" userId={admin?.id} />}
          {/* Admin comments feature removed */}
        </motion.div>
      </div>
    </div>
  );
};

const UsersManagement: React.FC<{ adminId?: string }> = () => {
  // Status badge component for user status
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusColors = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      suspended: 'bg-red-100 text-red-700 border-red-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[status as keyof typeof statusColors] || statusColors.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  const [userType, setUserType] = useState<'student' | 'teacher'>('student');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);
  const [sortConfig, setSortConfig] = useState<{ by: string; order: 'asc' | 'desc' }>({ by: 'name', order: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    percentageMin?: number;
    percentageMax?: number;
    nameStartsWith?: string;
    nameEndsWith?: string;
    classSection?: string;
    subject?: string;
    exam?: string;
    searchQuery?: string;
  }>({});

  // When an exam filter is selected, load per-student exam percentages for students
  useEffect(() => {
    const loadExamPercentagesForUsers = async (examType?: string) => {
      if (!examType) return;
      if (userType !== 'student') return;
      if (users.length === 0) return;
      try {
        const studentIds = users.map(u => u.id);
        const { data, error } = await supabase
          .from('marks')
          .select('student_id, marks_obtained, total_marks')
          .in('student_id', studentIds)
          .eq('exam_type', examType);

        if (error) {
          console.error('Error loading exam marks for users:', error);
          return;
        }

        const sums = new Map<string, { marks: number; total: number }>();
        (data || []).forEach((row: any) => {
          const sid = row.student_id;
          const current = sums.get(sid) || { marks: 0, total: 0 };
          current.marks += row.marks_obtained || 0;
          current.total += row.total_marks || 0;
          sums.set(sid, current);
        });

        setUsers(prev => prev.map(u => {
          const entry = sums.get(u.id);
          const pct = entry && entry.total > 0 ? (entry.marks / entry.total) * 100 : undefined;
          return {
            ...u,
            exam_percentage: pct !== undefined ? pct : u.exam_percentage
          };
        }));
      } catch (err) {
        console.error('Failed to load exam percentages for users', err);
      }
    };

    loadExamPercentagesForUsers(filters.exam);
  }, [filters.exam, users, userType]);
  
  // When a subject filter is selected, load per-student subject percentages (aggregate across exams)
  useEffect(() => {
    const loadSubjectPercentagesForUsers = async (subject?: string) => {
      if (!subject) return;
      if (userType !== 'student') return;
      if (users.length === 0) return;
      try {
        const studentIds = users.map(u => u.id);
        const { data, error } = await supabase
          .from('marks')
          .select('student_id, marks_obtained, total_marks')
          .in('student_id', studentIds)
          .eq('subject', subject);

        if (error) {
          console.error('Error loading subject marks for users:', error);
          return;
        }

        const sums = new Map<string, { marks: number; total: number }>();
        (data || []).forEach((row: any) => {
          const sid = row.student_id;
          const current = sums.get(sid) || { marks: 0, total: 0 };
          current.marks += row.marks_obtained || 0;
          current.total += row.total_marks || 0;
          sums.set(sid, current);
        });

        setUsers(prev => prev.map(u => {
          const entry = sums.get(u.id);
          const pct = entry && entry.total > 0 ? (entry.marks / entry.total) * 100 : undefined;
          return {
            ...u,
            subject_percentage: pct !== undefined ? pct : u.subject_percentage
          };
        }));
      } catch (err) {
        console.error('Failed to load subject percentages for users', err);
      }
    };

    loadSubjectPercentagesForUsers(filters.subject);
  }, [filters.subject, users, userType]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
  }, [userType]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [users, sortConfig, filters]);

  const loadUsers = async () => {
    setLoading(true);
    const table = userType === 'student' ? 'students' : 'teachers';
    const { data } = await supabase.from(table).select('*');
    if (data) {
      setUsers(data);
      if (userType === 'student') {
        const uniqueClasses = [...new Set(data.map((s: any) => s.class_section).filter(Boolean))].sort();
        setAvailableClasses(uniqueClasses);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    // Update filters when search query changes
    const delayDebounce = setTimeout(() => {
      setFilters(prev => ({ ...prev, searchQuery }));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const applyFiltersAndSort = () => {
    let filtered = [...users];

    // Global search filter that applies to both students and teachers
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(u => {
        const searchableFields = userType === 'student' 
          ? [u.name, u.admission_id, u.class_section] 
          : [u.name, u.teacher_id, u.email];
        return searchableFields.some(field => 
          field && field.toString().toLowerCase().includes(query)
        );
      });
    }

    if (userType === 'student') {
      if (filters.classSection) {
        filtered = filtered.filter(u => u.class_section === filters.classSection);
      }

      if (filters.percentageMin !== undefined) {
        filtered = filtered.filter(u => {
          const percentage = filters.subject ? (u.subject_percentage ?? u.exam_percentage ?? u.latest_percentage ?? u.overall_percentage ?? 0)
            : filters.exam ? (u.exam_percentage ?? u.latest_percentage ?? u.overall_percentage ?? 0)
            : (u.latest_percentage ?? u.overall_percentage ?? 0);
          return percentage >= filters.percentageMin!;
        });
      }

      if (filters.percentageMax !== undefined) {
        filtered = filtered.filter(u => {
          const percentage = filters.subject ? (u.subject_percentage ?? u.exam_percentage ?? u.latest_percentage ?? u.overall_percentage ?? 0)
            : filters.exam ? (u.exam_percentage ?? u.latest_percentage ?? u.overall_percentage ?? 0)
            : (u.latest_percentage ?? u.overall_percentage ?? 0);
          return percentage <= filters.percentageMax!;
        });
      }

      if (filters.nameStartsWith) {
        filtered = filtered.filter(u =>
          u.name.toUpperCase().startsWith(filters.nameStartsWith!)
        );
      }

      if (filters.nameEndsWith) {
        filtered = filtered.filter(u =>
          u.name.toUpperCase().endsWith(filters.nameEndsWith!)
        );
      }
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortConfig.by) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'admission_id':
          aVal = a.admission_id?.toLowerCase() || '';
          bVal = b.admission_id?.toLowerCase() || '';
          break;
        case 'latest_percentage':
          // If a subject filter is selected, prefer subject_percentage; otherwise if an exam filter is selected, prefer exam_percentage when sorting by percentage
          if (filters.subject) {
            aVal = a.subject_percentage ?? a.exam_percentage ?? a.latest_percentage ?? 0;
            bVal = b.subject_percentage ?? b.exam_percentage ?? b.latest_percentage ?? 0;
          } else if (filters.exam) {
            aVal = a.exam_percentage ?? a.latest_percentage ?? 0;
            bVal = b.exam_percentage ?? b.latest_percentage ?? 0;
          } else {
            aVal = a.latest_percentage || 0;
            bVal = b.latest_percentage || 0;
          }
          break;
        case 'overall_percentage':
          aVal = a.overall_percentage || 0;
          bVal = b.overall_percentage || 0;
          break;
        default:
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
      }

      if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  };

  const handleSortChange = (by: string, order: 'asc' | 'desc') => {
    setSortConfig({ by, order });
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleDelete = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setLoading(true);
    const table = userType === 'student' ? 'students' : 'teachers';
    
    // Get the user's email before deletion
    const { data: userData, error: fetchError } = await supabase
      .from(table)
      .select('email')
      .eq('id', userToDelete)
      .single();

    if (fetchError) {
      toast.error(`Failed to fetch user data: ${fetchError.message}`);
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', userToDelete);

    if (error) {
      toast.error(`Failed to delete ${userType}: ${error.message}`);
    } else {
      toast.success(`${userType.charAt(0).toUpperCase() + userType.slice(1)} deleted successfully`);
      loadUsers();
      
      // Dispatch a custom event for user deletion
      window.dispatchEvent(new CustomEvent('userDeleted', { 
        detail: { 
          email: userData.email,
          role: userType
        }
      }));
    }

    setShowDeleteModal(false);
    setUserToDelete(null);
    setLoading(false);
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-3">
              <button 
                onClick={() => setUserType('student')} 
                className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  userType === 'student' 
                    ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
                Students
                <span className="text-sm px-2 py-0.5 rounded-full bg-opacity-20 bg-current">
                  {filteredUsers.length}
                </span>
              </button>
              <button 
                onClick={() => setUserType('teacher')} 
                className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  userType === 'teacher' 
                    ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="w-5 h-5" />
                Teachers
                <span className="text-sm px-2 py-0.5 rounded-full bg-opacity-20 bg-current">
                  {filteredUsers.length}
                </span>
              </button>
            </div>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              <Plus className="w-5 h-5" />
              Add {userType === 'student' ? 'Student' : 'Teacher'}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${userType}s by name, ID${userType === 'student' ? ', or class' : ', or email'}...`}
              className="w-full px-4 py-2 pl-10 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </div>

      {userType === 'student' && (
        <div className="mb-6">
          <StudentFilterSort
            onSortChange={handleSortChange}
            onFilterChange={handleFilterChange}
            currentSort={sortConfig}
            filters={filters}
            availableClasses={availableClasses}
                availableSubjects={SUBJECT_MAPPINGS.map(s => s.name)}
                availableExams={EXAM_TYPES as unknown as string[]}
            showClassFilter={true}
          />
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:border-blue-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-blue-600 font-medium mt-1">{userType === 'student' ? `ID: ${user.admission_id}` : `ID: ${user.teacher_id}`}</p>
                  {userType === 'student' && (
                      <>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">{user.class_section}</span>
                        </div>
                        <div className="flex gap-2 mt-2 items-center">
                          {filters.subject ? (
                            <>
                              <span className="text-sm text-gray-600">
                                {filters.subject} Percentage:
                              </span>
                              {(() => {
                                const val = (user.subject_percentage != null) ? user.subject_percentage : (user.exam_percentage ?? user.latest_percentage ?? user.overall_percentage ?? 0);
                                return (
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    (val ?? 0) >= 75 ? 'bg-green-100 text-green-700' :
                                    (val ?? 0) >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {((val ?? 0)).toFixed(1)}%
                                  </span>
                                );
                              })()}
                            </>
                          ) : filters.exam ? (
                            <>
                              <span className="text-sm text-gray-600">
                                {filters.exam} Percentage:
                              </span>
                              {(() => {
                                const val = (user.exam_percentage != null) ? user.exam_percentage : (user.latest_percentage ?? user.overall_percentage ?? 0);
                                return (
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    (val ?? 0) >= 75 ? 'bg-green-100 text-green-700' :
                                    (val ?? 0) >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {((val ?? 0)).toFixed(1)}%
                                  </span>
                                );
                              })()}
                            </>
                          ) : (
                            <>
                              <span className="text-sm text-gray-600">Overall Percentage:</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                ((user.overall_percentage ?? user.latest_percentage ?? user.exam_percentage ?? 0)) >= 75 ? 'bg-green-100 text-green-700' :
                                ((user.overall_percentage ?? user.latest_percentage ?? user.exam_percentage ?? 0)) >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {((user.overall_percentage ?? user.latest_percentage ?? user.exam_percentage ?? 0)).toFixed(1)}%
                              </span>
                            </>
                          )}
                        </div>
                      </>
                  )}
                  {userType === 'teacher' && (
                    <TeacherClassDisplay teacherId={user.id} />
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => setUserToEdit(user)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title={`Edit ${userType}`}
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title={`Delete ${userType}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddUserModal userType={userType} onClose={() => { setShowAddModal(false); loadUsers(); }} />}
      {userToEdit && (
        <EditUserForm
          userType={userType}
          userData={userToEdit}
          onClose={() => setUserToEdit(null)}
          onUpdate={loadUsers}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {userType}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const TeacherClassDisplay: React.FC<{ teacherId: string }> = ({ teacherId }) => {
  const [classTeacherSection, setClassTeacherSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassTeacher();
  }, [teacherId]);

  const loadClassTeacher = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('class_teachers')
      .select('class_section')
      .eq('teacher_id', teacherId)
      .maybeSingle();

    if (data) {
      setClassTeacherSection(data.class_section);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-xs text-gray-500">Loading...</div>;

  return (
    <div className="mt-2">
      {classTeacherSection ? (
        <p className="text-xs text-gray-500">
          Class Teacher of: <span className="font-medium text-blue-600">{classTeacherSection}</span>
        </p>
      ) : (
        <p className="text-xs text-gray-400">Not a class teacher</p>
      )}
    </div>
  );
};

const AddUserModal: React.FC<{ userType: 'student' | 'teacher'; onClose: () => void }> = ({ userType, onClose }) => {
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [availableClassSections, setAvailableClassSections] = useState<any[]>([]);
  const [selectedClassSections, setSelectedClassSections] = useState<string[]>([]);
  const [subjectsByClassSection, setSubjectsByClassSection] = useState<Record<string, string[]>>({});
  const [classTeacherSection, setClassTeacherSection] = useState<string>('');
  const [newClassSection, setNewClassSection] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [studentClass, setStudentClass] = useState<string>('');
  const [studentSection, setStudentSection] = useState<string>('');

  useEffect(() => {
    if (userType === 'teacher' || userType === 'student') {
      loadClassSections();
    }
  }, [userType]);

  const loadClassSections = async () => {
    setLoading(true);
    const { data } = await supabase.from('class_sections').select('*').order('class_number, section');
    if (data) {
      setAvailableClassSections(data);
    }
    setLoading(false);
  };

  const getSubjectsForClassSection = (classSection: string): string[] => {
    const classNum = parseInt(classSection.split('-')[0]);
    if (isNaN(classNum)) return [];

    const subjects: string[] = [];
    if (classNum >= 1 && classNum <= 5) {
      subjects.push('Hindi', 'English', 'Maths', 'EVS', 'Computer');
    } else if (classNum >= 6 && classNum <= 8) {
      subjects.push('Hindi', 'English', 'Maths', 'Computer', 'S.St', 'Science');
    } else if (classNum >= 9 && classNum <= 10) {
      subjects.push('Hindi', 'English', 'Maths', 'S.St', 'Science', 'AI');
    }
    return subjects;
  };

  const toggleClassSectionSelection = (classSection: string) => {
    const isCurrentlySelected = selectedClassSections.includes(classSection);

    if (isCurrentlySelected) {
      setSelectedClassSections(prev => prev.filter(cs => cs !== classSection));
      const newSubjects = { ...subjectsByClassSection };
      delete newSubjects[classSection];
      setSubjectsByClassSection(newSubjects);
    } else {
      setSelectedClassSections(prev => [...prev, classSection]);
      setSubjectsByClassSection(prev => ({
        ...prev,
        [classSection]: []
      }));
    }
  };

  const toggleSubjectForClassSection = (classSection: string, subject: string) => {
    setSubjectsByClassSection(prev => {
      const current = prev[classSection] || [];
      const updated = current.includes(subject)
        ? current.filter(s => s !== subject)
        : [...current, subject];
      return { ...prev, [classSection]: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const table = userType === 'student' ? 'students' : 'teachers';
      const payload: any = { ...formData };

      if (table === 'teachers') {
        if (selectedClassSections.length === 0) {
          toast.error('Please select at least one class-section');
          setSubmitting(false);
          return;
        }

        const hasSubjects = selectedClassSections.every(cs =>
          subjectsByClassSection[cs] && subjectsByClassSection[cs].length > 0
        );

        if (!hasSubjects) {
          toast.error('Please select at least one subject for each class-section');
          setSubmitting(false);
          return;
        }

        // Validate class teacher selection if provided
        if (classTeacherSection && !selectedClassSections.includes(classTeacherSection)) {
          toast.error('Class teacher must be selected from the assigned class-sections');
          setSubmitting(false);
          return;
        }
      }

      if (table === 'students') {
        if (!payload.class_section) {
          toast.error('Please select class-section');
          setSubmitting(false);
          return;
        }
      }

      payload.status = payload.status || 'active';

      if (payload.password) {
        payload.password = btoa(payload.password);
      }

  const { data: insertedUser, error } = await insertWithPassword(table, payload);

      if (error) {
        console.error('Error adding user:', error);
        toast.error(`Failed to add ${userType}: ${error.message}`);
      } else {
        if (table === 'teachers' && insertedUser) {
          const newTeacherId = insertedUser?.id ?? null;
          console.log('Inserted teacher data:', insertedUser);
          console.log('Extracted teacher ID:', newTeacherId);

          if (!newTeacherId) {
            console.error('Could not determine inserted teacher id from:', insertedUser);
            toast.error('Teacher added but could not determine the created teacher id; assignments skipped');
          } else {
            // Collect all unique subjects being assigned
            const allSubjectsSet = new Set<string>();
            const mappings: any[] = [];

            for (const classSection of selectedClassSections) {
              const subjects = subjectsByClassSection[classSection] || [];
              for (const subject of subjects) {
                allSubjectsSet.add(subject);
                mappings.push({
                  teacher_id: newTeacherId,
                  class_section: classSection,
                  subject: subject
                });
              }
            }

            // Get subject codes for the subjects array
            const { data: subjectsData } = await supabase
              .from('subjects')
              .select('code, name')
              .in('name', Array.from(allSubjectsSet));

            const subjectCodes = subjectsData?.map(s => s.code) || [];

            // Update teacher record with subjects array
            if (subjectCodes.length > 0) {
              const { error: updateError } = await supabase
                .from('teachers')
                .update({ subjects: subjectCodes })
                .eq('id', newTeacherId);

              if (updateError) {
                console.error('Error updating teacher subjects:', updateError);
              }
            }

            if (mappings.length > 0) {
              const { error: mappingError } = await supabase
                .from('teacher_class_sections')
                .insert(mappings);

              if (mappingError) {
                console.error('Error adding class-section mappings:', mappingError);
                const msg = mappingError.message || JSON.stringify(mappingError);
                const detail = mappingError.details ? ` Details: ${mappingError.details}` : '';
                toast.error(`Teacher added but failed to save class-section assignments: ${msg}${detail}`);
              }
            }

            // Add class teacher assignment if selected
            if (classTeacherSection) {
              const { error: classTeacherError } = await supabase
                .from('class_teachers')
                .upsert({
                  class_section: classTeacherSection,
                  teacher_id: newTeacherId
                }, {
                  onConflict: 'class_section'
                });

              if (classTeacherError) {
                console.error('Error adding class teacher:', classTeacherError);
                const msg = classTeacherError.message || JSON.stringify(classTeacherError);
                const detail = classTeacherError.details ? ` Details: ${classTeacherError.details}` : '';
                toast.error(`Teacher added but failed to assign as class teacher: ${msg}${detail}`);
              }
            }
          }
        }

        toast.success(`${userType === 'student' ? 'Student' : 'Teacher'} added successfully`);
        onClose();
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast.error(err.message || 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Add {userType === 'student' ? 'Student' : 'Teacher'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder={userType === 'student' ? 'Admission ID' : 'Teacher ID'} required onChange={(e) => setFormData({ ...formData, [userType === 'student' ? 'admission_id' : 'teacher_id']: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          <input type="password" placeholder="Password" required onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          <input type="text" placeholder="Name" required onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          <input type="email" placeholder="Email" required onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          <input type="tel" placeholder="Phone" onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          {userType === 'student' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                <select
                  required
                  value={studentClass}
                  onChange={(e) => {
                    const newClass = e.target.value;
                    setStudentClass(newClass);
                    setStudentSection('');
                    if (newClass && studentSection) {
                      setFormData({
                        ...formData,
                        class_name: newClass,
                        section: studentSection,
                        class_section: `${newClass}-${studentSection}`
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Class</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section *</label>
                <select
                  required
                  value={studentSection}
                  onChange={(e) => {
                    const newSection = e.target.value;
                    setStudentSection(newSection);
                    if (studentClass && newSection) {
                      setFormData({
                        ...formData,
                        class_name: studentClass,
                        section: newSection,
                        class_section: `${studentClass}-${newSection}`
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Section</option>
                  {studentClass === '8' || studentClass === '9' || studentClass === '10' ? (
                    <>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="NEEV">NEEV</option>
                    </>
                  ) : (
                    <>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}
          {userType === 'student' && (
            <>
              <label className="text-sm text-gray-600">Date of Birth</label>
              <input type="date" placeholder="Date of Birth" required onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />

              <label className="text-sm text-gray-600">Blood Group</label>
              <select required onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>

              <input type="text" placeholder="Father's Name" onChange={(e) => setFormData({ ...formData, father_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <input type="text" placeholder="Mother's Name" onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <input type="text" placeholder="Address" onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <input type="url" placeholder="Profile Photo URL" onChange={(e) => setFormData({ ...formData, profile_photo: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </>
          )}
          {userType === 'teacher' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class-Sections * (Select multiple)</label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <> 
                      {availableClassSections.length === 0 ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="No class-sections found. Enter class-section (e.g. 5-A)"
                            value={newClassSection}
                            onChange={(e) => setNewClassSection(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cs = (newClassSection || '').trim();
                              if (!cs) return;
                              if (!selectedClassSections.includes(cs)) {
                                setSelectedClassSections(prev => [...prev, cs]);
                                setSubjectsByClassSection(prev => ({ ...prev, [cs]: [] }));
                              }
                              setNewClassSection('');
                            }}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableClassSections.map(cs => (
                            <label
                              key={cs.id}
                              className={`flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-colors ${
                                selectedClassSections.includes(cs.class_section)
                                  ? 'bg-blue-100 border-2 border-blue-500'
                                  : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedClassSections.includes(cs.class_section)}
                                onChange={() => toggleClassSectionSelection(cs.class_section)}
                                className="rounded text-blue-500"
                              />
                              <span className="text-sm font-medium">{cs.class_section}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {selectedClassSections.length > 0 && (
                  <div className="mt-2 text-sm text-blue-600 font-medium">Selected: {selectedClassSections.join(', ')}</div>
                )}
              </div>

              {selectedClassSections.length > 0 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Subjects for Each Class-Section *</label>
                  {selectedClassSections.map(classSection => {
                    const availableSubjects = getSubjectsForClassSection(classSection);
                    const selectedSubjects = subjectsByClassSection[classSection] || [];

                    return (
                      <div key={classSection} className="border-2 border-gray-200 rounded-xl p-4 bg-white">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm">{classSection}</span>
                          <span className="text-sm text-gray-500">- Select Subjects</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {availableSubjects.map(subject => (
                            <label
                              key={subject}
                              className={`flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg transition-colors ${
                                selectedSubjects.includes(subject)
                                  ? 'bg-green-100 border-2 border-green-500'
                                  : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedSubjects.includes(subject)}
                                onChange={() => toggleSubjectForClassSection(classSection, subject)}
                                className="rounded text-green-500"
                              />
                              <span className="text-sm font-medium">{subject}</span>
                            </label>
                          ))}
                        </div>
                        {selectedSubjects.length > 0 && (
                          <div className="mt-2 text-xs text-green-600 font-medium">✓ {selectedSubjects.length} subject(s) selected</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedClassSections.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Teacher (Optional)</label>
                  <select
                    value={classTeacherSection}
                    onChange={(e) => setClassTeacherSection(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Not a class teacher</option>
                    {selectedClassSections.map(cs => (
                      <option key={cs} value={cs}>Class Teacher of {cs}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Select one class-section if this teacher will be the class teacher</p>
                </div>
              )}
              <input type="url" placeholder="Profile Photo URL" onChange={(e) => setFormData({ ...formData, profile_photo: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </>
          )}
          <button type="submit" disabled={submitting} className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">{submitting ? 'Adding...' : 'Add User'}</button>
        </form>
      </div>

    </div>
  );
};


const GalleryManagement: React.FC<{ adminId?: string }> = ({ adminId }) => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    const { data } = await supabase.from('gallery_images').select('*').order('display_order');
    if (data) setImages(data);
    setLoading(false);
  };

  const handleAddImage = async (imageData: any) => {
    const { error } = await supabase.from('gallery_images').insert({ ...imageData, uploaded_by: adminId || null });
    if (error) {
      console.error('Error adding image:', error);
      toast.error(`Failed to add image: ${error.message}`);
    } else {
      toast.success('Image added successfully');
      loadImages();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('gallery_images').update({ is_active: !isActive }).eq('id', id);
    if (error) {
      console.error('Error updating image:', error);
      toast.error(`Failed to update image: ${error.message}`);
    } else {
      toast.success('Image status updated');
      loadImages();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('gallery_images').delete().eq('id', id);
    if (error) {
      console.error('Error deleting image:', error);
      toast.error(`Failed to delete image: ${error.message}`);
    } else {
      toast.success('Image deleted');
      loadImages();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gallery Images</h2>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <Plus className="w-5 h-5" />
          Add Image
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="border rounded-lg overflow-hidden">
              <img src={image.image_url} alt={image.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold">{image.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{image.description}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleActive(image.id, image.is_active)} className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg ${image.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {image.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {image.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button onClick={() => handleDelete(image.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddImageModal onClose={() => setShowAddModal(false)} onSubmit={handleAddImage} />}
    </div>
  );
};

const AddImageModal: React.FC<{ onClose: () => void; onSubmit: (data: any) => void }> = ({ onClose, onSubmit }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ image_url: imageUrl, title, description, display_order: 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Add Gallery Image</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="url" placeholder="Image URL" required value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          <input type="text" placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg" />
          <button type="submit" className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Add Image</button>
        </form>
      </div>
    </div>
  );
};

const NoticesManagement: React.FC<{ adminId?: string }> = ({ adminId }) => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    setLoading(true);
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (data) setNotices(data);
    setLoading(false);
  };

  const handleAddNotice = async (noticeData: any) => {
    const payload = {
      ...noticeData,
      created_by: adminId || null,
      is_active: true,
      date: noticeData.date || new Date().toISOString(),
    };

    const { error } = await supabase.from('notices').insert(payload);
    if (error) {
      console.error('Error adding notice:', error);
      toast.error(`Failed to add notice: ${error.message}`);
    } else {
      toast.success('Notice added successfully');
      loadNotices();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('notices').update({ is_active: !isActive }).eq('id', id);
    if (error) {
      console.error('Error updating notice:', error);
      toast.error(`Failed to update notice: ${error.message}`);
    } else {
      toast.success('Notice status updated');
      loadNotices();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) {
      console.error('Error deleting notice:', error);
      toast.error(`Failed to delete notice: ${error.message}`);
    } else {
      toast.success('Notice deleted');
      loadNotices();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Notices</h2>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <Plus className="w-5 h-5" />
          Add Notice
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div key={notice.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{notice.title}</h3>
                  <p className="text-gray-600 mt-1">{notice.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded ${notice.priority === 'high' ? 'bg-red-100 text-red-700' : notice.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{notice.priority}</span>
                    <span>{new Date(notice.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleActive(notice.id, notice.is_active)} className={`p-2 rounded-lg ${notice.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {notice.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleDelete(notice.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddNoticeModal onClose={() => setShowAddModal(false)} onSubmit={handleAddNotice} />}
    </div>
  );
};

const AddNoticeModal: React.FC<{ onClose: () => void; onSubmit: (data: any) => void }> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, content, priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Add Notice</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          <textarea placeholder="Content" required value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full px-4 py-2 border rounded-lg" />
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full px-4 py-2 border rounded-lg">
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <button type="submit" className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Add Notice</button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
