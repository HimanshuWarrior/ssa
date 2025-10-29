import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  id: string;
  comment_text: string;
  commenter_role: 'teacher' | 'admin';
  // DB column is `commented_by` (uuid). Some older code attempted to use `commented_by_id`.
  commented_by?: string;
  commented_by_id?: string;
  // Populated client-side after lookup
  commenter_name?: string;
  created_at: string;
}

interface StudentCommentsProps {
  studentId: string;
  viewMode?: 'student' | 'teacher-admin';
}

const StudentComments: React.FC<StudentCommentsProps> = ({
  studentId,
  viewMode = 'student'
}) => {
  const { userProfile, isAdmin, isTeacher } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Only reload when studentId changes. loadComments is intentionally omitted from deps
  // to avoid re-creating the effect - the function does an internal fetch based on studentId.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadComments();
  }, [studentId]);

  const loadComments = async () => {
    if (loading) return;
    try {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const { data, error } = await supabase
        .from('student_comments')
        .select('*')
        .eq('student_id', studentId)
        .gte('created_at', tenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Use a looser record type for raw DB rows to avoid `any`
      const fetched = (data ?? []) as Array<Record<string, unknown>>;

      // Collect unique commenter ids (account for either column name)
      const commenterIds = Array.from(new Set(
        fetched
          .map((c) => {
            const v = c['commented_by'] ?? c['commented_by_id'];
            return typeof v === 'string' ? v : (v == null ? '' : String(v));
          })
          .filter((s) => !!s)
      ));

      const idToName: Record<string, string> = {};

      if (commenterIds.length > 0) {
        // Fetch teacher names
        const teachersRes = await supabase
          .from('teachers')
          .select('id, name')
          .in('id', commenterIds as string[]);
        const teachers = (teachersRes.data ?? []) as Array<{ id: string; name: string }>;

        teachers.forEach((t) => {
          idToName[t.id] = t.name;
        });

        // Fetch admin names
        const adminsRes = await supabase
          .from('admins')
          .select('id, name')
          .in('id', commenterIds as string[]);
        const admins = (adminsRes.data ?? []) as Array<{ id: string; name: string }>;

        admins.forEach((a) => {
          idToName[a.id] = a.name;
        });
      }

      const enriched: Comment[] = fetched.map((c) => {
        const idRaw = c['commented_by'] ?? c['commented_by_id'];
        const id = typeof idRaw === 'string' ? idRaw : (idRaw == null ? undefined : String(idRaw));
        const base = {
          id: String(c['id'] ?? ''),
          comment_text: String(c['comment_text'] ?? ''),
          commenter_role: (String(c['commenter_role'] ?? 'teacher') as 'teacher' | 'admin'),
          created_at: String(c['created_at'] ?? ''),
        } as Comment;
        return {
          ...base,
          commented_by: id,
          commenter_name: id ? idToName[id] : undefined,
        } as Comment;
      });

      setComments(enriched);
    } catch (error: unknown) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    // Debug authentication state
    console.log('Auth State:', {
      hasUserProfile: !!userProfile,
      userRole: userProfile?.role,
      isTeacher,
      isAdmin
    });

    if (!userProfile) {
      toast.error('Please log in to continue');
      return;
    }

    if (!isTeacher && !isAdmin) {
      console.log('Role check failed:', { userProfile, isTeacher, isAdmin });
      toast.error('You must be a teacher or admin to add comments');
      return;
    }

    // Determine the commenter role
    let commenterRole: 'teacher' | 'admin';
    if (isAdmin) {
      commenterRole = 'admin';
    } else if (isTeacher) {
      commenterRole = 'teacher';
    } else {
      toast.error('You do not have permission to add comments');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to insert comment:', {
        student_id: studentId,
        commented_by: userProfile.id,
        commenter_role: commenterRole,
        userProfileId: userProfile.id
      });
      
      const { error } = await supabase
        .from('student_comments')
        .insert({
          student_id: studentId,
          commented_by_id: userProfile.id,
          commenter_role: commenterRole,
          comment_text: newComment.trim()
        });

      if (error) {
        if (error.message.includes('violates row-level security policy')) {
          throw new Error('You do not have permission to add comments for this student. Please ensure this student is in your assigned class.');
        }
        throw error;
      }

      toast.success('Comment added successfully');
      setNewComment('');
      setShowAddForm(false);
      loadComments();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error adding comment:', error);
      toast.error(msg || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string, commentOwnerId: string) => {
    if (!userProfile) {
      toast.error('Please log in to delete comments');
      return;
    }

    if (userProfile.id !== commentOwnerId) {
      toast.error('You can only delete your own comments');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('student_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment deleted successfully');
      loadComments();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error deleting comment:', error);
      toast.error(msg || 'Failed to delete comment');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Teacher Comments
        </h3>
        {(isAdmin || isTeacher) && viewMode === 'teacher-admin' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Add Comment
          </button>
        )}
      </div>

      {showAddForm && viewMode === 'teacher-admin' && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleAddComment}
          className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200"
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment here..."
            className="w-full px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            required
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Posting...' : 'Post Comment'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {comments.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No comments yet</p>
            </div>
          ) : (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      comment.commenter_role === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {comment.commenter_role === 'admin' ? 'Admin' : 'Teacher'}
                    </span>
                    <div className="text-sm font-medium text-gray-900">
                      {comment.commenter_name || (comment.commenter_role === 'admin' ? 'Admin' : 'Teacher')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                    {userProfile && comment.commented_by === userProfile.id && viewMode === 'teacher-admin' && (
                      <button
                        onClick={() => handleDeleteComment(comment.id, comment.commented_by!)}
                        className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{comment.comment_text}</p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentComments;
