# Authentication Fix Checklist

## Pre-Fix Checklist

Before applying the fix, verify:

- [ ] You have access to Supabase Dashboard
- [ ] Your project URL is: `wmfaswytunszqokmlxls.supabase.co`
- [ ] You can open the SQL Editor in Supabase
- [ ] You understand this will delete existing data
- [ ] This is a development/test environment (not production)

## Applying the Fix

### Step 1: Run SQL Script
- [ ] Open [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Navigate to your project
- [ ] Click "SQL Editor" in left sidebar
- [ ] Open `FIX_DATABASE.sql` file
- [ ] Copy ALL content (Ctrl+A, Ctrl+C)
- [ ] Paste into SQL Editor
- [ ] Click "RUN" button
- [ ] Wait for "Success. No rows returned" message
- [ ] Check for any error messages (should be none)

### Step 2: Verify Database
- [ ] Go to "Table Editor" in Supabase
- [ ] Confirm these tables exist:
  - [ ] `students`
  - [ ] `teachers`
  - [ ] `admins`
  - [ ] `class_sections`
  - [ ] `teacher_class_sections`
  - [ ] `class_teachers`
- [ ] Click on `admins` table
- [ ] Verify row exists: h@gmail.com
- [ ] Click on `students` table
- [ ] Verify row exists: himanshu123
- [ ] Click on `teachers` table
- [ ] Verify row exists: Avinash

### Step 3: Clear Browser Data
- [ ] Open your web app in browser
- [ ] Press F12 (open DevTools)
- [ ] Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
- [ ] Find "Local Storage" in left panel
- [ ] Click on your app's domain
- [ ] Delete `loggedUser` item (or click "Clear All")
- [ ] Close DevTools
- [ ] Refresh page (Ctrl+R or F5)

## Testing the Fix

### Test Admin Login
- [ ] Go to login section
- [ ] Select "Administrator" role
- [ ] Enter email: `h@gmail.com`
- [ ] Enter password: `123`
- [ ] Click "Sign In"
- [ ] Should redirect to Admin Dashboard
- [ ] Should see "Welcome back, Himanshu"
- [ ] Should see tabs: Manage Users, Gallery, Notices, Marks Management

### Test Admin Features
- [ ] Click "Manage Users" tab
- [ ] Should see "Students" and "Teachers" buttons
- [ ] Click "Students"
- [ ] Should see student: himanshu123
- [ ] Click "Add Student" button
- [ ] Modal should open
- [ ] Cancel and close modal
- [ ] Click "Teachers" button
- [ ] Should see teacher: Avinash
- [ ] Should show "Class Teacher of: 9-A"
- [ ] Click "Add Teacher" button
- [ ] Should see class-section selection
- [ ] Cancel and close modal
- [ ] Click "Logout" button
- [ ] Should redirect to home page

### Test Student Login
- [ ] Go to login section
- [ ] Select "Student" role
- [ ] Enter Admission ID: `himanshu123`
- [ ] Enter password: `123`
- [ ] Click "Sign In"
- [ ] Should redirect to Student Dashboard
- [ ] Should see "Welcome, Himanshu Yadav"
- [ ] Should see class: 9-A
- [ ] Should see attendance section (may be empty)
- [ ] Should see marks section (may be empty)
- [ ] Click "Logout"
- [ ] Should redirect to home page

### Test Teacher Login
- [ ] Go to login section
- [ ] Select "Teacher" role
- [ ] Enter Teacher ID: `Avinash`
- [ ] Enter password: `abc`
- [ ] Click "Sign In"
- [ ] Should redirect to Teacher Dashboard
- [ ] Should see "Welcome, Avinash Kumar"
- [ ] Should see assigned classes: 9-A, 9-B, 10-A
- [ ] Should see class teacher assignment: 9-A
- [ ] Should see tabs or sections for managing students
- [ ] Click "Logout"
- [ ] Should redirect to home page

## Post-Fix Verification

### Database Integrity
- [ ] Run this query in SQL Editor:
  ```sql
  SELECT 'admins' as table_name, COUNT(*) as count FROM admins
  UNION ALL
  SELECT 'students', COUNT(*) FROM students
  UNION ALL
  SELECT 'teachers', COUNT(*) FROM teachers
  UNION ALL
  SELECT 'class_sections', COUNT(*) FROM class_sections;
  ```
- [ ] Should show:
  - admins: 1
  - students: 1
  - teachers: 1
  - class_sections: 38 (or more)

### Teacher Assignments
- [ ] Run this query:
  ```sql
  SELECT t.name, tcs.class_section, tcs.subject
  FROM teacher_class_sections tcs
  JOIN teachers t ON t.id = tcs.teacher_id;
  ```
- [ ] Should show 3 rows for Avinash:
  - 9-A, Maths
  - 9-B, Maths
  - 10-A, Maths

### Class Teachers
- [ ] Run this query:
  ```sql
  SELECT ct.class_section, t.name
  FROM class_teachers ct
  JOIN teachers t ON t.id = ct.teacher_id;
  ```
- [ ] Should show: 9-A, Avinash Kumar

## Adding New Users

### Add New Student (via Admin)
- [ ] Login as admin (h@gmail.com / 123)
- [ ] Go to Manage Users → Students
- [ ] Click "Add Student"
- [ ] Fill in form:
  - Admission ID: (e.g., "TEST001")
  - Password: (e.g., "password123")
  - Name: (e.g., "Test Student")
  - Email: (e.g., "test@example.com")
  - Class: Select a class (e.g., "9")
  - Section: Select a section (e.g., "A")
  - DOB, Blood Group, etc.
- [ ] Click "Add User"
- [ ] Should see success message
- [ ] Student should appear in list
- [ ] Logout
- [ ] Login as new student
- [ ] Should work!

### Add New Teacher (via Admin)
- [ ] Login as admin
- [ ] Go to Manage Users → Teachers
- [ ] Click "Add Teacher"
- [ ] Fill in form:
  - Teacher ID: (e.g., "TEACH001")
  - Password: (e.g., "password123")
  - Name: (e.g., "Test Teacher")
  - Email: (e.g., "teacher@example.com")
  - Select class-sections (e.g., 9-A, 9-B)
  - For each class-section, select subjects
  - Optionally make them a class teacher
- [ ] Click "Add User"
- [ ] Should see success message
- [ ] Teacher should appear in list
- [ ] Should show their class-sections
- [ ] Logout
- [ ] Login as new teacher
- [ ] Should work!
- [ ] Should see assigned classes

## Troubleshooting Checklist

If login doesn't work:
- [ ] Check browser console (F12) for errors
- [ ] Verify localStorage was cleared
- [ ] Check Supabase logs for database errors
- [ ] Re-run the SQL script
- [ ] Verify tables exist in Table Editor
- [ ] Check .env file has correct credentials
- [ ] Try in incognito/private browser window

If you see "Invalid credentials":
- [ ] Double-check the email/ID and password
- [ ] Make sure to use the exact credentials:
  - Admin: h@gmail.com (not admin@school.edu)
  - Student: himanshu123 (all lowercase)
  - Teacher: Avinash (capital A)
- [ ] Passwords are case-sensitive: 123 and abc (lowercase)

If you see "Database error":
- [ ] Check Supabase is online
- [ ] Verify .env has correct URL and anon key
- [ ] Check Supabase logs for specific error
- [ ] Re-run SQL script

## Success Criteria

You've successfully fixed the authentication if:
- ✅ All three roles can log in
- ✅ Each role sees their correct dashboard
- ✅ Admin can add new students and teachers
- ✅ Teacher can see their assigned classes
- ✅ Student can see their class information
- ✅ Logout works for all roles
- ✅ No errors in browser console
- ✅ No errors in Supabase logs

## Next Steps After Success

Once authentication is working:
1. [ ] Add more students to different classes
2. [ ] Add more teachers with different subjects
3. [ ] Test marks management features
4. [ ] Test gallery upload and management
5. [ ] Test notices posting and viewing
6. [ ] Explore other features of the app

## Need Help?

If you're stuck, check these resources:
- `QUICK_FIX_GUIDE.md` - Simple 3-step guide
- `AUTHENTICATION_FIX.md` - Detailed explanation
- `FIX_SUMMARY.txt` - Complete summary
- Supabase Dashboard → Logs - Real-time error messages
- Browser Console (F12) - JavaScript errors

---

**Remember**: The SQL script will DELETE all existing data. Make sure you're okay with that before running it!
