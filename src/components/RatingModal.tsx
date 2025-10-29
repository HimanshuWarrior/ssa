import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface RatingModalProps {
  studentId: string;
  onClose: () => void;
}

interface RatingOption {
  type: 'teacher' | 'course' | 'school' | 'homework';
  label: string;
  placeholder: string;
}

const ratingOptions: RatingOption[] = [
  { type: 'teacher', label: 'Rate a Teacher', placeholder: 'Enter teacher name' },
  { type: 'course', label: 'Rate a Course', placeholder: 'Enter course/subject name' },
  { type: 'school', label: 'Rate the School', placeholder: 'Overall school experience' },
  { type: 'homework', label: 'Rate Homework', placeholder: 'Enter homework/assignment title' },
];

const RatingModal: React.FC<RatingModalProps> = ({ studentId, onClose }) => {
  const [selectedType, setSelectedType] = useState<RatingOption | null>(null);
  const [targetName, setTargetName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType || !targetName.trim() || rating === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('ratings').insert({
        student_id: studentId,
        rating_type: selectedType.type,
        rating_value: rating,
        target_id: targetName.toLowerCase().replace(/\s+/g, '_'),
        target_name: targetName,
        comment: comment.trim(),
      });

      if (error) throw error;

      toast.success('Rating submitted successfully!');
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl">Submit a Rating</h3>
              <p className="text-sm text-white/80 mt-1">Share your feedback and help improve our school</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Select Rating Type */}
            {!selectedType ? (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">What would you like to rate?</label>
                <div className="grid grid-cols-1 gap-3">
                  {ratingOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => setSelectedType(option)}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all text-left group"
                    >
                      <span className="font-medium text-gray-900 group-hover:text-amber-600">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Selected Type Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">{selectedType.label}</h4>
                  <button
                    onClick={() => {
                      setSelectedType(null);
                      setTargetName('');
                      setRating(0);
                      setComment('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Change
                  </button>
                </div>

                {/* Target Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {selectedType.type === 'school' ? 'Feedback Category' : 'Name'}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    placeholder={selectedType.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* Star Rating */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Rating<span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-10 h-10 ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-sm text-gray-600">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </p>
                  )}
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts and feedback..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !targetName.trim() || rating === 0}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Rating
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RatingModal;
