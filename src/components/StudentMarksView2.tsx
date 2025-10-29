import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mark } from '../lib/types';
import LoadingSpinner from './ui/LoadingSpinner';
import ModernCard from './ui/ModernCard';
import { BookOpen } from 'lucide-react';

interface StudentMarksViewProps {
  studentId: string;
  admissionId: string;
  classId: string;
}

const StudentMarksView2: React.FC<StudentMarksViewProps> = ({ studentId, admissionId, classId }) => {
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marksHistory, setMarksHistory] = useState<any[]>([]);
  const [latestExamPercentage, setLatestExamPercentage] = useState<number>(0);

  useEffect(() => {
    loadMarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, classId]);

  const loadMarks = async () => {
    try {
      setLoading(true);

      // Prefer class-filtered marks when classId available
      let marksQuery: any = supabase
        .from('marks')
        .select(`
          *,
          subject:subjects(id, name, code),
          class:classes(id, name, section)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (classId && String(classId).trim() !== '') {
        marksQuery = marksQuery.eq('class_id', classId);
      }

      const { data: marksData, error: marksError } = await marksQuery;
      if (marksError) throw marksError;

      let effectiveMarks: any[] = marksData || [];

      if (effectiveMarks.length === 0 && classId && String(classId).trim() !== '') {
        const { data: fallbackMarks } = await supabase
          .from('marks')
          .select(`
            *,
            subject:subjects(id, name, code),
            class:classes(id, name, section)
          `)
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });
        effectiveMarks = fallbackMarks || [];
      }

      setMarks(effectiveMarks || []);

      const uniqueSubjects = [...new Set((effectiveMarks || []).map((m: any) => m.subject_id))];

      if (uniqueSubjects.length > 0) {
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .in('id', uniqueSubjects);
        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);
      } else {
        setSubjects([]);
      }

      const { data: historyData, error: historyError } = await supabase
        .from('marks_history')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyError) throw historyError;
      setMarksHistory(historyData || []);

      if (effectiveMarks && effectiveMarks.length > 0) {
        const latestExam = effectiveMarks.reduce((latest: any, mark: any) => {
          return new Date(mark.updated_at) > new Date(latest.updated_at) ? mark : latest;
        });

        const latestExamType = latestExam.exam_type;
        const latestExamMarks = effectiveMarks.filter((m: any) => m.exam_type === latestExamType);

        const totalMarks = latestExamMarks.reduce((sum: number, m: any) => sum + Number(m.total_marks ?? 0), 0);
        const obtainedMarks = latestExamMarks.reduce((sum: number, m: any) => sum + Number(m.marks_obtained ?? 0), 0);

        if (totalMarks > 0) {
          setLatestExamPercentage(Math.round((obtainedMarks / totalMarks) * 100));
        } else {
          setLatestExamPercentage(0);
        }
      } else {
        setLatestExamPercentage(0);
      }

    } catch (err: any) {
      // If marks_history table doesn't exist, just ignore that error
      if (err?.message?.includes('marks_history')) {
        console.log('Marks history not available yet');
      } else {
        console.error('Error loading marks', err);
        toast.error('Failed to load some marks data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getExamTypeColor = (examType: string) => {
    switch (examType) {
      case 'PA1': return 'bg-blue-100 text-blue-800';
      case 'PA2': return 'bg-green-100 text-green-800';
      case 'Half Yearly': return 'bg-purple-100 text-purple-800';
      case 'PA3': return 'bg-yellow-100 text-yellow-800';
      case 'PA4': return 'bg-pink-100 text-pink-800';
      case 'Annual': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {latestExamPercentage > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium mb-1">Latest Exam Performance</h3>
              <p className="text-sm opacity-90">Overall percentage from most recent exam</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{latestExamPercentage}%</div>
              <div className="text-sm mt-1 opacity-90">
                {latestExamPercentage >= 90 ? 'Outstanding!' : latestExamPercentage >= 75 ? 'Excellent!' : latestExamPercentage >= 60 ? 'Good!' : latestExamPercentage >= 45 ? 'Keep Improving!' : 'Needs Attention'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map(subject => (
          <ModernCard key={subject.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{subject.name}</h3>
                <p className="text-sm text-gray-500">{subject.code}</p>
              </div>
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <div className="mt-4 space-y-3">
              {marks.filter(m => m.subject_id === subject.id).map(mark => (
                <div key={mark.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getExamTypeColor(mark.exam_type)}`}>
                      {mark.exam_type}
                    </span>
                    {mark.remarks && <p className="text-sm text-gray-600 mt-1">{mark.remarks}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">{mark.marks_obtained}/{mark.total_marks}</div>
                    <div className="text-xs text-gray-500">Updated: {new Date(mark.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </ModernCard>
        ))}
      </div>

      {marksHistory.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Recent Updates</h3>
          <div className="space-y-2">
            {marksHistory.map((history: any) => (
              <div key={history.id} className="p-3 bg-white rounded-lg shadow-sm border">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{history.exam_type} - {subjects.find(s => s.id === history.subject_id)?.name}</span>
                    <p className="text-xs text-gray-500">Changed from {history.old_marks} to {history.new_marks}</p>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(history.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMarksView2;
