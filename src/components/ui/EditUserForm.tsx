import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface EditUserFormProps {
  userType: 'student' | 'teacher';
  userData: any;
  onClose: () => void;
  onUpdate: () => void;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ userType, userData, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [availableClassSections, setAvailableClassSections] = useState<any[]>([]);
  const [selectedClassSections, setSelectedClassSections] = useState<string[]>([]);
  const [subjectsByClassSection, setSubjectsByClassSection] = useState<Record<string, string[]>>({});
  const [classTeacherSection, setClassTeacherSection] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [studentClass, setStudentClass] = useState<string>('');
  const [studentSection, setStudentSection] = useState<string>('');

  useEffect(() => {
    setFormData(userData || {});
    if (userType === 'teacher') {
      loadClassSections();
      loadExistingTeacherData();
    }
    if (userType === 'student' && userData?.class_section) {
      const parts = userData.class_section.split('-');
      if (parts.length === 2) {
        setStudentClass(parts[0]);
        setStudentSection(parts[1]);
      }
      loadClassSections();
    }
  }, [userData, userType]);

  const loadClassSections = async () => {
    setLoading(true);
    const { data } = await supabase.from('class_sections').select('*').order('class_number, section');
    if (data) setAvailableClassSections(data);
    setLoading(false);
  };

  const loadExistingTeacherData = async () => {
    if (!userData?.id) return;
    const { data } = await supabase
      .from('teacher_class_sections')
      .select('*')
      .eq('teacher_id', userData.id);

    if (data && data.length > 0) {
      const uniqueCS = [...new Set(data.map(item => item.class_section))];
      setSelectedClassSections(uniqueCS);

      const subjectsMap: Record<string, string[]> = {};
      data.forEach(item => {
        if (!subjectsMap[item.class_section]) {
          subjectsMap[item.class_section] = [];
        }
        if (!subjectsMap[item.class_section].includes(item.subject)) {
          subjectsMap[item.class_section].push(item.subject);
        }
      });
      setSubjectsByClassSection(subjectsMap);
    }

    // Load class teacher assignment
    const { data: classTeacherData } = await supabase
      .from('class_teachers')
      .select('class_section')
      .eq('teacher_id', userData.id)
      .maybeSingle();

    if (classTeacherData) {
      setClassTeacherSection(classTeacherData.class_section);
    }
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

      delete payload.id;

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

        // Ensure class_name and section are set
        const [classNum, sectionVal] = payload.class_section.split('-');
        payload.class_name = classNum;
        payload.section = sectionVal;

        // Log the payload for debugging
        console.log('Updating student with payload:', {
          class_name: payload.class_name,
          section: payload.section,
          class_section: payload.class_section
        });
      }

      if (!payload.password) {
        delete payload.password;
      } else {
        payload.password = btoa(payload.password);
      }

      const { error } = await supabase.from(table).update(payload).eq('id', userData.id);

      if (error) {
        console.error('Error updating user:', error);
        toast.error(`Failed to update ${userType}: ${error.message}`);
      } else {
        console.log(`${userType} updated successfully`);
        
        // Handle teacher-specific updates
        if (table === 'teachers' && userData.id) {
          await supabase
            .from('teacher_class_sections')
            .delete()
            .eq('teacher_id', userData.id);

          const mappings = [];
          for (const classSection of selectedClassSections) {
            const subjects = subjectsByClassSection[classSection] || [];
            for (const subject of subjects) {
              mappings.push({
                teacher_id: userData.id,
                class_section: classSection,
                subject: subject
              });
            }
          }

          if (mappings.length > 0) {
            const { error: mappingError } = await supabase
              .from('teacher_class_sections')
              .insert(mappings);

            if (mappingError) {
              console.error('Error updating class-section mappings:', mappingError);
              toast.error('Teacher updated but failed to save class-section assignments');
            }
          }

          // Update class teacher assignment
          // First, remove any existing class teacher assignment for this teacher
          await supabase
            .from('class_teachers')
            .delete()
            .eq('teacher_id', userData.id);

          // Then add new class teacher assignment if selected
          if (classTeacherSection) {
            const { error: classTeacherError } = await supabase
              .from('class_teachers')
              .upsert({
                class_section: classTeacherSection,
                teacher_id: userData.id
              }, {
                onConflict: 'class_section'
              });

            if (classTeacherError) {
              console.error('Error updating class teacher:', classTeacherError);
              toast.error('Teacher updated but failed to assign as class teacher');
            }
          }
        }

        toast.success(`${userType === 'student' ? 'Student' : 'Teacher'} updated successfully`);
        onUpdate();
        onClose();
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast.error(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Edit {userType === 'student' ? 'Student' : 'Teacher'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-gray-500 mb-2">{userType === 'student' ? `Admission ID: ${userData?.admission_id}` : `Teacher ID: ${userData?.teacher_id}`}</div>

          <input type="password" placeholder="New Password (leave empty to keep current)" onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <input type="text" placeholder="Name" required value={formData?.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <input type="email" placeholder="Email" required value={formData?.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <input type="tel" placeholder="Phone" value={formData?.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

          {userType === 'student' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                  <select
                    required
                    value={studentClass}
                    onChange={(e) => {
                      const newClass = e.target.value;
                      setStudentClass(newClass);
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

              <label className="text-sm text-gray-600">Date of Birth</label>
              <input type="date" placeholder="Date of Birth" required value={formData?.dob || ''} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

              <label className="text-sm text-gray-600">Blood Group</label>
              <select value={formData?.blood_group || ''} onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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

              <input type="text" placeholder="Father's Name" value={formData?.father_name || ''} onChange={(e) => setFormData({ ...formData, father_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <input type="text" placeholder="Mother's Name" value={formData?.mother_name || ''} onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <input type="text" placeholder="Address" value={formData?.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <input type="url" placeholder="Profile Photo URL" value={formData?.profile_photo || ''} onChange={(e) => setFormData({ ...formData, profile_photo: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </>
          )}

          {userType === 'teacher' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class-Sections * (Select multiple)</label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                  {loading ? <LoadingSpinner size="sm" /> : (
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
              <input type="url" placeholder="Profile Photo URL" value={formData?.profile_photo || ''} onChange={(e) => setFormData({ ...formData, profile_photo: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </>
          )}
          <button type="submit" disabled={submitting} className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">{submitting ? 'Updating...' : 'Update User'}</button>
        </form>
      </div>
    </div>
  );
};

export default EditUserForm;
