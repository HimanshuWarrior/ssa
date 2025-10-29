export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'teacher';
  name: string;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  section: string;
  academic_year: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  created_at: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  class?: Class;
  subject?: Subject;
}

export interface Mark {
  id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  marks_obtained: number;
  total_marks: number;
  exam_type: 'PA1' | 'PA2' | 'Half Yearly' | 'PA3' | 'PA4' | 'Annual';
  updated_by: string;
  updated_at: string;
  exam_date: string;
  remarks?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    name: string;
    admission_id: string;
  };
  class?: Class;
  subject?: Subject;
}

export interface Student {
  id: string;
  admission_id: string;
  name: string;
  email?: string;
  phone?: string;
  dob: string;
  blood_group: string;
  class_name: string;
  section: string;
  class_id?: string;
  father_name?: string;
  mother_name?: string;
  address?: string;
  profile_photo?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  teacher_id: string;
  name: string;
  email: string;
  phone?: string;
  subjects: string[];
  classes: string[];
  sections: string[];
  profile_photo?: string;
  status: string;
  created_at: string;
  updated_at: string;
}
