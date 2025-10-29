import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, MinusCircle, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import LoadingSpinner from './ui/LoadingSpinner';

interface Student {
  id: string;
  admission_id: string;
  name: string;
  class_section: string;
}

interface AttendanceRecord {
  id?: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'half_day';
  remarks?: string;
}

interface AttendanceManagementProps {
  teacherId: string;
  classSection: string;
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({
  teacherId,
  classSection
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
  const [historyDays, setHistoryDays] = useState(10);

  useEffect(() => {
    loadStudents();
  }, [classSection]);

  useEffect(() => {
    if (students.length > 0) {
      loadAttendance();
    }
  }, [selectedDate, students]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, admission_id, name, class_section')
        .eq('class_section', classSection)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('class_section', classSection)
        .eq('date', selectedDate);

      if (error) throw error;

      const attendanceMap: Record<string, AttendanceRecord> = {};
      (data || []).forEach((record: any) => {
        attendanceMap[record.student_id] = record;
      });

      setAttendance(attendanceMap);
    } catch (error: any) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'half_day') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        student_id: studentId,
        date: selectedDate,
        status,
      }
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.values(attendance).map(record => ({
        student_id: record.student_id,
        date: selectedDate,
        status: record.status,
        marked_by: teacherId,
        class_section: classSection,
        remarks: record.remarks
      }));

      for (const record of records) {
        const { error } = await supabase
          .from('daily_attendance')
          .upsert(record, {
            onConflict: 'student_id,date'
          });

        if (error) throw error;
      }

      toast.success('Attendance saved successfully');
      loadAttendance();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const marked = Object.keys(attendance).length;
    const present = Object.values(attendance).filter(a => a.status === 'present').length;
    const absent = Object.values(attendance).filter(a => a.status === 'absent').length;
    const halfDay = Object.values(attendance).filter(a => a.status === 'half_day').length;

    return { total, marked, present, absent, halfDay };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Attendance Management - {classSection}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <Users className="w-6 h-6 mx-auto mb-1" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs opacity-90">Total Students</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-300" />
            <div className="text-2xl font-bold">{stats.present}</div>
            <div className="text-xs opacity-90">Present</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <XCircle className="w-6 h-6 mx-auto mb-1 text-red-300" />
            <div className="text-2xl font-bold">{stats.absent}</div>
            <div className="text-xs opacity-90">Absent</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <MinusCircle className="w-6 h-6 mx-auto mb-1 text-yellow-300" />
            <div className="text-2xl font-bold">{stats.halfDay}</div>
            <div className="text-xs opacity-90">Half Day</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1" />
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
            </div>
            <div className="text-xs opacity-90">Attendance</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'today'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mark Attendance
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'history'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              View History
            </button>
          </div>
        </div>

        {viewMode === 'today' ? (
          <>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {students.map((student, index) => {
                const currentStatus = attendance[student.id]?.status || 'present';

                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{student.name}</h4>
                        <p className="text-sm text-gray-500">ID: {student.admission_id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`p-3 rounded-lg transition-all ${
                            currentStatus === 'present'
                              ? 'bg-green-500 text-white shadow-lg scale-110'
                              : 'bg-white text-gray-400 hover:bg-green-50 hover:text-green-500 border-2 border-gray-200'
                          }`}
                          title="Present"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`p-3 rounded-lg transition-all ${
                            currentStatus === 'absent'
                              ? 'bg-red-500 text-white shadow-lg scale-110'
                              : 'bg-white text-gray-400 hover:bg-red-50 hover:text-red-500 border-2 border-gray-200'
                          }`}
                          title="Absent"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'half_day')}
                          className={`p-3 rounded-lg transition-all ${
                            currentStatus === 'half_day'
                              ? 'bg-yellow-500 text-white shadow-lg scale-110'
                              : 'bg-white text-gray-400 hover:bg-yellow-50 hover:text-yellow-500 border-2 border-gray-200'
                          }`}
                          title="Half Day"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveAttendance}
                disabled={saving || Object.keys(attendance).length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </>
        ) : (
          <AttendanceHistory
            classSection={classSection}
            students={students}
            days={historyDays}
          />
        )}
      </div>
    </div>
  );
};

const AttendanceHistory: React.FC<{
  classSection: string;
  students: Student[];
  days: number;
}> = ({ classSection, students, days }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [classSection, days]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('class_section', classSection)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const dates = [...new Set(history.map(h => h.date))].sort().reverse();

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900">Last {days} Days Attendance</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Student</th>
              {dates.slice(0, 10).map(date => (
                <th key={date} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border">
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 border text-sm font-medium text-gray-900">
                  {student.name}
                </td>
                {dates.slice(0, 10).map(date => {
                  const record = history.find(h => h.student_id === student.id && h.date === date);
                  return (
                    <td key={date} className="px-4 py-3 border text-center">
                      {record ? (
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'absent'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {record.status === 'present' ? 'P' : record.status === 'absent' ? 'A' : 'H'}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceManagement;
