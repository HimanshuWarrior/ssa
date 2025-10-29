import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const resetSupabaseClient = async () => {
  // Just clear the session without creating a new client
  await supabase.auth.signOut();
  localStorage.removeItem('supabase.auth.token');
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: localStorage
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'my-app-name'
    }
  }
})

// Debug function to test database connection
export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    console.log('Supabase URL:', supabaseUrl);
    
    // Single simple query to admins table
    const { data: allAdmins, error: allError } = await supabase
      .from('admins')
      .select('*');
    
    if (allError) {
      console.error('Database test error:', allError);
      return false;
    }
    
    // Log email and basic encoding info to help detect hidden chars / mismatches
    // Print full JSON so console doesn't collapse important fields
    try {
      console.log('All admins in database (full):', JSON.stringify(allAdmins, null, 2));
    } catch (e) {
      console.log('All admins in database (fallback):', allAdmins.map(admin => ({
        email: admin.email,
        emailLength: admin.email ? admin.email.length : 0,
        emailChars: admin.email ? [...admin.email].map((c: string) => c.charCodeAt(0)) : [],
        password: admin.password ? `[${admin.password.length} chars]` : null
      })));
    }

    // Check for exact and normalized match for the test email
    const testEmail = 'h@gmail.com';
    const exactMatch = (allAdmins || []).find((a: any) => a.email === testEmail);
    const normalizedMatch = (allAdmins || []).find((a: any) => a.email && a.email.trim().toLowerCase() === testEmail.trim().toLowerCase());
    console.log('Exact match for', testEmail, ':', !!exactMatch, exactMatch ? { email: exactMatch.email, chars: [...exactMatch.email].map((c: string) => c.charCodeAt(0)), len: exactMatch.email.length } : null );
    console.log('Normalized match for', testEmail, ':', !!normalizedMatch, normalizedMatch ? { email: normalizedMatch.email, chars: [...normalizedMatch.email].map((c: string) => c.charCodeAt(0)), len: normalizedMatch.email.length } : null );

    // Direct query for our admin
    const { data: testAdmin, error: testError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', 'h@gmail.com')
      .maybeSingle();

    if (testError) {
      console.error('Test admin lookup error:', testError);
    } else {
      console.log('Test admin lookup result:', testAdmin ? {
        ...testAdmin,
        password: testAdmin.password ? `[${testAdmin.password.length} chars]` : null
      } : 'Not found');
    }
    
    return true;
  } catch (e) {
    console.error('Database test exception:', e);
    return false;
  }
}

// Small helper to stringify Supabase errors for clearer logs
const formatError = (err: any) => {
  try {
    if (!err) return String(err);
    if (err.message) return `${err.message} ${JSON.stringify(err)}`;
    return JSON.stringify(err);
  } catch (e) {
    return String(err);
  }
}

// Debug function to test admin access
export const testAdminAccess = async (email: string) => {
  try {
    console.log('Testing admin access for:', email);
    
    // Try with explicit count first
    const { count, error: countError } = await supabase
      .from('admins')
      .select('*', { count: 'exact' })
      .eq('email', email);
    
    console.log('Count query result:', { count, error: countError });

    // Try direct select
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, name, password')
      .eq('email', email);
    
    console.log('Direct select result:', {
      found: !!data?.length,
      records: data?.length,
      error: error ? error.message : null
    });

    return { data, error };
  } catch (e) {
    console.error('Test failed:', e);
    return { data: null, error: e };
  }
};

// Database types
export interface Student {
  id: string
  admission_id: string
  name: string
  email?: string
  phone?: string
  dob: string
  blood_group: string
  class_name: string
  section: string
  father_name?: string
  mother_name?: string
  address?: string
  profile_photo?: string
  status: string
  created_at: string
  updated_at: string
}

export interface Teacher {
  id: string
  teacher_id: string
  name: string
  email: string
  phone?: string
  subjects: string[]
  classes: string[]
  sections: string[]
  profile_photo?: string
  status: string
  created_at: string
  updated_at: string
}

export interface Homework {
  id: string
  title: string
  description?: string
  subject: string
  class_name: string
  section: string
  submission_date?: string
  created_by: string
  teacher_name?: string
  attachments?: string[]
  status: string
  created_at: string
  updated_at: string
}

export interface Notice {
  id: string
  title: string
  content: string
  date: string
  priority: 'low' | 'medium' | 'high'
  target_audience: 'all' | 'students' | 'teachers' | 'parents'
  created_by: string
  attachments?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  student_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  remarks?: string
  marked_by: string
  created_at: string
}

export interface Grade {
  id: string
  student_id: string
  subject: string
  exam_type: string
  marks_obtained: number
  total_marks: number
  grade?: string
  exam_date?: string
  created_by: string
  created_at: string
}

export interface Event {
  id: string
  title: string
  description?: string
  event_date: string
  event_time?: string
  location?: string
  event_type: 'academic' | 'sports' | 'cultural' | 'general' | 'holiday'
  target_audience: string
  created_by: string
  is_active: boolean
  created_at: string
}

export interface AdmissionApplication {
  id: string
  student_name: string
  father_name: string
  mother_name?: string
  email: string
  phone: string
  dob: string
  address: string
  grade_applying: string
  previous_school?: string
  documents?: string[]
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted'
  remarks?: string
  created_at: string
  updated_at: string
}

export interface NeevApplication {
  id: string
  student_id?: string
  student_name: string
  father_name: string
  email: string
  phone: string
  dob: string
  aim?: string
  target_exams?: string
  status: 'pending' | 'approved' | 'rejected'
  progress_step: number
  interview_date?: string
  test_score?: number
  remarks?: string
  created_at: string
  updated_at: string
}

export interface LibraryBook {
  id: string
  title: string
  author: string
  isbn?: string
  category: string
  total_copies: number
  available_copies: number
  location?: string
  created_at: string
}

export interface BookIssue {
  id: string
  book_id: string
  student_id: string
  issue_date: string
  due_date: string
  return_date?: string
  fine_amount: number
  status: 'issued' | 'returned' | 'overdue'
  created_at: string
}

export interface FeeRecord {
  id: string
  student_id: string
  fee_type: string
  amount: number
  due_date: string
  paid_date?: string
  payment_method?: string
  transaction_id?: string
  status: 'pending' | 'paid' | 'overdue' | 'partial'
  remarks?: string
  created_at: string
}

export interface Timetable {
  id: string
  class_name: string
  section: string
  day_of_week: number
  period_number: number
  subject: string
  teacher_id: string
  start_time: string
  end_time: string
  room_number?: string
  created_at: string
}

// Auth helpers
export const signInWithCredentials = async (credentials: { admission_id?: string, teacher_id?: string, email?: string }, password: string, role: string) => {
  try {
    console.log('Attempting Supabase authentication:', { credentials, role });
    console.log('Raw password length:', password.length);
    console.log('Raw password chars:', [...password].map(c => c.charCodeAt(0)));

    // Encode password for comparison (matching how we store it)
    const encodedPassword = btoa(password);
    console.log('Encoded password:', encodedPassword);

    // Authenticate based on role
    if (role === 'student' && credentials.admission_id) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('admission_id', credentials.admission_id)
        .maybeSingle();

      if (error) {
        console.error('Student lookup error:', formatError(error));
        return { user: null, error: 'Database error occurred' };
      }

      // DEBUG: log lookup result shape (non-sensitive).
      try {
        console.log('Student lookup result:', data);
      } catch (e) {
        // ignore
      }

      // Support both `password` and `hashed_password` column names
      const storedPassword = data ? (data.password ?? data.hashed_password ?? data.hashedPassword ?? null) : null;

      // DEBUG: show basic info about stored password and comparison (do NOT log full passwords in production)
      try {
        console.log('Full database record:', { ...data, password: '***', hashed_password: '***' });
        const maskedStored = storedPassword ? `${String(storedPassword).slice(0,4)}...(${String(storedPassword).length})` : null;
        const maskedEncoded = `${encodedPassword.slice(0,4)}...(${encodedPassword.length})`;
        console.log('storedPassword:', maskedStored, 'encodedPassword:', maskedEncoded);
        console.log('storedPassword type:', typeof storedPassword);
        console.log('encodedPassword type:', typeof encodedPassword);
        console.log('Exact match?:', storedPassword === encodedPassword);
        console.log('Length match?:', storedPassword?.length === encodedPassword?.length);
        if (!data) console.log('No data found');
        // Also allow raw password match in case DB stored plain text (temporary tolerance)
        if (storedPassword !== encodedPassword && storedPassword !== password) console.log('Password mismatch');
      } catch (e) {
        console.error('Debug logging error:', e);
      }

      const studentPasswordMatches = storedPassword === encodedPassword || storedPassword === password;

      if (!data || !studentPasswordMatches) {
        return { user: null, error: 'Invalid admission ID or password' };
      }

      return { user: { ...data, role: 'student' }, error: null };
    }

    if (role === 'teacher' && credentials.teacher_id) {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('teacher_id', credentials.teacher_id)
        .maybeSingle();

      if (error) {
        console.error('Teacher lookup error:', formatError(error));
        return { user: null, error: 'Database error occurred' };
      }


      const storedPassword = data ? (data.password ?? data.hashed_password ?? data.hashedPassword ?? null) : null;
      const teacherPasswordMatches = storedPassword === encodedPassword || storedPassword === password;

      if (!data || !teacherPasswordMatches) {
        return { user: null, error: 'Invalid teacher ID or password' };
      }

      return { user: { ...data, role: 'teacher' }, error: null };
    }

    if (role === 'admin' && credentials.email) {
        // Debug: Log the query we're about to make and normalize email input
        console.log('Looking up admin with email:', credentials.email);
    const lookupEmail = credentials.email ? credentials.email.trim().toLowerCase() : credentials.email;
    console.log('Normalized lookup email:', lookupEmail, 'length:', lookupEmail?.length, 'chars:', lookupEmail ? [...lookupEmail].map(c => c.charCodeAt(0)) : []);
    console.log('Raw password:', password);
    console.log('Encoded password:', encodedPassword);

        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('email', lookupEmail)
          .maybeSingle();
          
        // Debug the raw result
        console.log('Raw DB result:', data);

        // Debug: Log the result
        console.log('Admin lookup result (eq):', data ? { ...data, password: '[MASKED]' } : 'No data found');

        // If no exact match, attempt a case-insensitive fallback (handles case differences)
    let fallbackData = null;
        if (!data && !error && lookupEmail) {
          try {
            const resp = await supabase
              .from('admins')
              .select('*')
              .ilike('email', lookupEmail)
              .maybeSingle();
            fallbackData = resp.data;
            if (fallbackData) console.log('Admin lookup result (ilike fallback):', { ...fallbackData, password: '[MASKED]' });
          } catch (e) {
            console.error('Fallback admin lookup error:', e);
          }
        }

    const finalData = data ?? fallbackData;
      
      if (error) {
        console.error('Admin lookup error:', formatError(error));
        return { user: null, error: 'Database error occurred' };
      }

  const storedPassword = finalData ? (finalData.password ?? finalData.hashed_password ?? finalData.hashedPassword ?? null) : null;
      console.log('Stored password from DB:', storedPassword);

      // Try both encoded and raw password matches, with debug logging
      const encodedMatches = storedPassword === encodedPassword;
      const rawMatches = storedPassword === password;
      const adminPasswordMatches = encodedMatches || rawMatches;
      
      console.log('Password comparison:', {
        storedPasswordExists: !!storedPassword,
        storedPasswordLength: storedPassword?.length,
        storedPasswordValue: storedPassword,
        encodedPasswordLength: encodedPassword?.length,
        encodedPasswordValue: encodedPassword,
        rawPasswordLength: password?.length,
        rawPasswordValue: password,
        encodedMatches,
        rawMatches,
        matches: adminPasswordMatches
      });

      if (!finalData || !adminPasswordMatches) {
        console.log('Auth failed:', !finalData ? 'No admin found' : 'Password mismatch');
        return { user: null, error: 'Invalid email or password' };
      }

      return { user: { ...finalData, role: 'admin' }, error: null };
    }

    return { user: null, error: 'Invalid credentials' };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Authentication failed. Please try again.' };
  }
};

// Insert helper that retries using `hashed_password` column if `password` column is not present
export const insertWithPassword = async (table: string, payload: any) => {
  try {
    // Try inserting as-is first
    const { data, error } = await supabase.from(table).insert(payload).select('id').single();
    if (!error) {
      return { data, error: null };
    }

    const errStr = formatError(error);
    // If the error indicates the `password` column is missing, retry mapping to `hashed_password`
    if (/Could not find the 'password' column|password.*column/i.test(errStr)) {
      const payload2 = { ...payload };
      if (payload2.password) {
        payload2.hashed_password = payload2.password;
        delete payload2.password;
      }
      const retry = await supabase.from(table).insert(payload2).select('id').single();
      return { data: retry.data, error: retry.error };
    }

    return { data: null, error };
  } catch (e: any) {
    return { data: null, error: e };
  }
};


// Data fetching helpers
export const fetchStudents = async (classFilter?: string, sectionFilter?: string) => {
  let query = supabase.from('students').select('*');
  
  if (classFilter) query = query.eq('class_name', classFilter);
  if (sectionFilter) query = query.eq('section', sectionFilter);
  
  return query.order('name');
};

export const fetchTeachers = async () => {
  return supabase.from('teachers').select('*').order('name');
};

export const fetchHomework = async (classFilter?: string, sectionFilter?: string) => {
  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
    // Return empty array for demo
    return { data: [], error: null };
  }
  
  let query = supabase.from('homework').select(`
    *,
    teacher:teachers(name)
  `);
  
  if (classFilter) query = query.eq('class_name', classFilter);
  if (sectionFilter) query = query.eq('section', sectionFilter);
  
  return query.order('created_at', { ascending: false });
};

export const fetchNotices = async () => {
  return supabase
    .from('notices')
    .select(`*`)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
};

export const fetchEvents = async () => {
  return supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('event_date');
};

export const fetchAttendance = async (studentId: string, dateFrom?: string, dateTo?: string) => {
  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
    // Return sample attendance data for demo
    return { 
      data: [
        { id: '1', student_id: studentId, date: '2024-01-15', status: 'present', created_at: new Date().toISOString() },
        { id: '2', student_id: studentId, date: '2024-01-14', status: 'present', created_at: new Date().toISOString() },
        { id: '3', student_id: studentId, date: '2024-01-13', status: 'present', created_at: new Date().toISOString() },
        { id: '4', student_id: studentId, date: '2024-01-12', status: 'absent', created_at: new Date().toISOString() },
        { id: '5', student_id: studentId, date: '2024-01-11', status: 'present', created_at: new Date().toISOString() },
      ], 
      error: null 
    };
  }
  
  let query = supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId);
    
  if (dateFrom) query = query.gte('date', dateFrom);
  if (dateTo) query = query.lte('date', dateTo);
  
  return query.order('date', { ascending: false });
};

export const fetchGrades = async (studentId: string) => {
  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
    // Return sample grades data for demo
    return { 
      data: [
        { 
          id: '1', 
          student_id: studentId, 
          subject: 'Mathematics', 
          exam_type: 'Mid Term', 
          marks_obtained: 85, 
          total_marks: 100, 
          exam_date: '2024-01-10',
          created_at: new Date().toISOString() 
        },
        { 
          id: '2', 
          student_id: studentId, 
          subject: 'Science', 
          exam_type: 'Mid Term', 
          marks_obtained: 92, 
          total_marks: 100, 
          exam_date: '2024-01-12',
          created_at: new Date().toISOString() 
        },
        { 
          id: '3', 
          student_id: studentId, 
          subject: 'English', 
          exam_type: 'Mid Term', 
          marks_obtained: 78, 
          total_marks: 100, 
          exam_date: '2024-01-14',
          created_at: new Date().toISOString() 
        }
      ], 
      error: null 
    };
  }
  
  return supabase
    .from('grades')
    .select('*')
    .eq('student_id', studentId)
    .order('exam_date', { ascending: false });
};