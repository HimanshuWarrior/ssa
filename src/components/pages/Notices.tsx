import React, { useState, useEffect } from 'react';
import { ChevronDown, Bell, Calendar, User, CircleAlert as AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, fetchNotices, Notice } from '../../lib/supabase';
import LoadingSpinner from '../ui/LoadingSpinner';
import ModernCard from '../ui/ModernCard';

const Notices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const { data, error } = await fetchNotices();
      if (error) {
        console.error('Error loading notices:', error);
        setNotices([]);
      } else {
        setNotices(data || []);
      }
    } catch (error) {
      console.error('Unexpected error loading notices:', error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Bell className="w-4 h-4" />;
      case 'low': return <Calendar className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const filteredNotices = filter === 'all' 
    ? notices 
    : notices.filter(notice => notice.priority === filter);

  const excerpt = (text: string, len = 120) => {
    if (text.length <= len) return text;
    return text.slice(0, len).trimEnd() + '…';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-3">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">School Notices</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest announcements, events, and important information from Shakti Shanti Academy.
          </p>
        </motion.div>

        {/* Filter buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {['all', 'high', 'medium', 'low'].map((priority) => (
            <button
              key={priority}
              onClick={() => setFilter(priority as any)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                filter === priority
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {priority === 'all' ? 'All Notices' : `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`}
            </button>
          ))}
        </motion.div>

        <div className="space-y-6">
          <AnimatePresence>
            {filteredNotices.map((notice, idx) => {
              const isOpen = expandedId === notice.id;
              return (
                <motion.div
                  key={notice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <ModernCard 
                    className="overflow-hidden"
                    gradient={idx % 2 === 0 ? 'blue' : 'yellow'}
                  >
                    <button
                      onClick={() => toggle(notice.id)}
                      aria-expanded={isOpen}
                      className="w-full text-left p-6 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{notice.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(notice.date).toLocaleDateString()}</span>
                                </div>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${getPriorityColor(notice.priority)}`}>
                                  {getPriorityIcon(notice.priority)}
                                  <span className="capitalize font-medium">{notice.priority}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  <span className="capitalize">{notice.target_audience}</span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <ChevronDown 
                                className={`w-6 h-6 text-gray-500 transform transition-transform duration-200 ${
                                  isOpen ? 'rotate-180 text-blue-600' : ''
                                }`} 
                              />
                            </div>
                          </div>

                          <div className="text-gray-700">
                            {!isOpen ? excerpt(notice.content) : notice.content}
                          </div>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-6 pb-6 border-t border-gray-100 bg-gray-50/50"
                        >
                          <div className="pt-4">
                            <div className="prose prose-sm max-w-none">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {notice.content}
                              </p>
                            </div>
                            
                            {notice.attachments && notice.attachments.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Attachments:</h4>
                                <div className="space-y-1">
                                  {notice.attachments.map((attachment, i) => (
                                    <a
                                      key={i}
                                      href={attachment}
                                      className="text-blue-600 hover:text-blue-800 text-sm underline block"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Attachment {i + 1}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </ModernCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredNotices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No notices found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'There are no notices available at the moment.' 
                : `No notices with ${filter} priority found.`
              }
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Notices;
