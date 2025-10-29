import { supabase } from './supabase';
import type { UserProfile, TeacherAssignment, Mark, Class, Subject } from './types';

export const getUserProfile = async (email: string): Promise<UserProfile | null> => {
  // Try admin first
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (adminData) {
    return {
      id: adminData.id,
      email: adminData.email,
      role: 'admin' as const,
      name: adminData.name,
      created_at: adminData.created_at || new Date().toISOString(),
      updated_at: adminData.updated_at || new Date().toISOString()
    };
  }

  // Try teacher
  const { data: teacherData, error: teacherError } = await supabase
    .from('teachers')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (teacherData) {
    return {
      id: teacherData.id,
      email: teacherData.email,
      role: 'teacher' as const,
      name: teacherData.name,
      teacher_id: teacherData.id,
      created_at: teacherData.created_at || new Date().toISOString(),
      updated_at: teacherData.updated_at || new Date().toISOString()
    };
  }

  console.error('Error fetching user profile:', { adminError, teacherError });
  return null;
};

export const isAdmin = (profile: UserProfile | null): boolean => {
  return profile?.role === 'admin';
};

export const isTeacher = (profile: UserProfile | null): boolean => {
  return profile?.role === 'teacher';
};

export const getTeacherAssignments = async (teacherId: string): Promise<TeacherAssignment[]> => {
  const { data, error } = await supabase
    .from('teacher_assignments')
    .select(`
      *,
      class:classes(*),
      subject:subjects(*)
    `)
    .eq('teacher_id', teacherId);

  if (error) {
    console.error('Error fetching teacher assignments:', error);
    return [];
  }

  return data || [];
};

export const canTeacherAccessMark = async (
  teacherId: string,
  classId: string,
  subjectId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('teacher_assignments')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('class_id', classId)
    .eq('subject_id', subjectId)
    .maybeSingle();

  if (error) {
    console.error('Error checking teacher access:', error);
    return false;
  }

  return !!data;
};

export const fetchClasses = async (userProfile?: UserProfile | null): Promise<Class[]> => {
  let query = supabase.from('classes').select('*');

  if (userProfile && isTeacher(userProfile) && userProfile.teacher_id) {
    const assignments = await getTeacherAssignments(userProfile.teacher_id);
    const classIds = assignments.map(a => a.class_id);

    if (classIds.length > 0) {
      query = query.in('id', classIds);
    } else {
      return [];
    }
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }

  return data || [];
};

export const fetchSubjects = async (userProfile?: UserProfile | null): Promise<Subject[]> => {
  let query = supabase.from('subjects').select('*');

  // If the user is a teacher, only return subjects they teach
  if (userProfile && isTeacher(userProfile) && userProfile.teacher_id) {
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('subjects')
      .eq('id', userProfile.teacher_id)
      .single();

    if (teacherData?.subjects && teacherData.subjects.length > 0) {
      query = query.in('name', teacherData.subjects);
    } else {
      return [];
    }
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }

  return data || [];
};

export const fetchMarks = async (
  userProfile?: UserProfile | null,
  filters?: {
    studentId?: string;
    classId?: string;
    subjectId?: string;
  }
): Promise<Mark[]> => {
  let query = supabase
    .from('marks')
    .select(`
      *,
      student:students(id, name, admission_id),
      class:classes(*),
      subject:subjects(*)
    `);

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }

  if (filters?.classId) {
    query = query.eq('class_id', filters.classId);
  }

  if (filters?.subjectId) {
    query = query.eq('subject_id', filters.subjectId);
  }

  // If the user is a teacher, only return marks for their classes and subjects
  if (userProfile && isTeacher(userProfile) && userProfile.teacher_id) {
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('classes, subjects')
      .eq('id', userProfile.teacher_id)
      .single();

    if (teacherData) {
      query = query.in('class_name', teacherData.classes);
      if (teacherData.subjects.length > 0) {
        query = query.in('subject_id', teacherData.subjects);
      }
    }
  }

  const { data, error } = await query.order('exam_date', { ascending: false });

  if (error) {
    console.error('Error fetching marks:', error);
    return [];
  }

  return data || [];
};

export const createMark = async (
  mark: Omit<Mark, 'id' | 'created_at' | 'updated_at'>,
  userProfile: UserProfile
): Promise<{ data: Mark | null; error: string | null }> => {
  // For teachers, verify they can access this class and subject
  if (isTeacher(userProfile) && userProfile.teacher_id) {
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('classes, subjects')
      .eq('id', userProfile.teacher_id)
      .single();

    const hasAccess = teacherData &&
      teacherData.classes.includes(mark.class_id) &&
      teacherData.subjects.includes(mark.subject_id);

    if (!hasAccess) {
      return {
        data: null,
        error: 'You do not have permission to add marks for this class and subject'
      };
    }
  }

  const { data, error } = await supabase
    .from('marks')
    .insert([mark])
    .select()
    .single();

  if (error) {
    console.error('Error creating mark:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
};

export const updateMark = async (
  markId: string,
  updates: Partial<Mark>,
  userProfile: UserProfile
): Promise<{ data: Mark | null; error: string | null }> => {
  const { data: existingMark, error: fetchError } = await supabase
    .from('marks')
    .select('*')
    .eq('id', markId)
    .single();

  if (fetchError || !existingMark) {
    return { data: null, error: 'Mark not found' };
  }

  // For teachers, verify they can access this class and subject
  if (isTeacher(userProfile) && userProfile.teacher_id) {
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('classes, subjects')
      .eq('id', userProfile.teacher_id)
      .single();

    const hasAccess = teacherData &&
      teacherData.classes.includes(existingMark.class_id) &&
      teacherData.subjects.includes(existingMark.subject_id);

    if (!hasAccess) {
      return {
        data: null,
        error: 'You do not have permission to update marks for this class and subject'
      };
    }
  }

  const { data, error } = await supabase
    .from('marks')
    .update(updates)
    .eq('id', markId)
    .select()
    .single();

  if (error) {
    console.error('Error updating mark:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
};

export const createClass = async (
  classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Class | null; error: string | null }> => {
  const { data, error } = await supabase
    .from('classes')
    .insert([classData])
    .select()
    .single();

  if (error) {
    console.error('Error creating class:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
};

export const createSubject = async (
  subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Subject | null; error: string | null }> => {
  const { data, error } = await supabase
    .from('subjects')
    .insert([subjectData])
    .select()
    .single();

  if (error) {
    console.error('Error creating subject:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
};

export const createTeacherAssignment = async (
  assignment: Omit<TeacherAssignment, 'id' | 'created_at'>
): Promise<{ data: TeacherAssignment | null; error: string | null }> => {
  const { data, error } = await supabase
    .from('teacher_assignments')
    .insert([assignment])
    .select()
    .single();

  if (error) {
    console.error('Error creating teacher assignment:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
};

export const deleteTeacherAssignment = async (
  assignmentId: string
): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from('teacher_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    console.error('Error deleting teacher assignment:', error);
    return { error: error.message };
  }

  return { error: null };
};
