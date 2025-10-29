import React, { useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicRatingForm from './PublicRatingForm';
import { supabase } from '../lib/supabase';

interface Testimonial {
  name: string;
  role: string;
  relationship: string;
  image?: string;
  content: string;
  rating: number;
}

const TestimonialsSection: React.FC = () => {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAllRatings, setShowAllRatings] = useState(false);
  const [displayCount, setDisplayCount] = useState(4);

  useEffect(() => {
    loadRatings();
  }, []);

  // Listen for locally submitted ratings and update UI optimistically
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const ce = ev as CustomEvent;
        const r = ce.detail;
        const newTestimonial: Testimonial = {
          name: r.name || 'Anonymous',
          role: r.role || r.relationship || 'Visitor',
          relationship: r.relationship || r.role || 'Visitor',
          content: r.content || r.comment || 'Thank you for your feedback!',
          rating: r.rating || 0,
          image: r.image || 'data\\images\\Default.jpg'
        };

        setAllTestimonials(prev => [newTestimonial, ...prev]);

        setRatingsCount(prevCount => {
          const newCount = prevCount + 1;
          // update average using previous avg and count
          setAverageRating(prevAvg => ((prevAvg * prevCount) + newTestimonial.rating) / newCount);
          return newCount;
        });

        setTestimonials(prev => {
          if (showAllRatings) return [newTestimonial, ...prev];
          return [newTestimonial, ...prev].slice(0, displayCount);
        });
      } catch (err) {
        console.error('Failed to handle publicRatingSubmitted event', err);
      }
    };

    window.addEventListener('publicRatingSubmitted', handler as EventListener);
    return () => window.removeEventListener('publicRatingSubmitted', handler as EventListener);
  }, [displayCount, showAllRatings]);

  const loadRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('public_ratings')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedTestimonials = data.map((rating: any) => ({
          name: rating.name,
          role: rating.relationship || 'Visitor',
          relationship: rating.relationship,
          content: rating.comment || 'Great school!',
          rating: rating.rating,
          image: 'data\\images\\Default.jpg'
        }));
        setAllTestimonials(formattedTestimonials);
        setTestimonials(formattedTestimonials.slice(0, displayCount));
        setRatingsCount(data.length);
        const avgRating = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
        setAverageRating(avgRating);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showAllRatings) {
      setTestimonials(allTestimonials);
    } else {
      setTestimonials(allTestimonials.slice(0, displayCount));
    }
  }, [showAllRatings, allTestimonials, displayCount]);

  return (
    <section className="py-20 bg-gradient-to-br from-white via-orange-50/20 to-yellow-50/30 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full mb-6 shadow-lg"
          >
            <Star className="w-5 h-5 text-white fill-white" />
            <span className="text-white font-semibold text-sm">Parent Testimonials</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Parents Say
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-yellow-600 to-amber-600">
              About Our School
            </span>
          </h2>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it. Here's what our community has to say about their experience with Shakti Shanti Academy.
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-orange-500"></div>
            <p className="mt-4 text-gray-600">Loading testimonials...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">No testimonials yet. Be the first to rate our school!</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-orange-200 overflow-hidden h-full flex flex-col">
                <div className="absolute top-4 right-4 text-orange-400 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                  <Quote className="w-16 h-16" />
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 leading-relaxed mb-6 flex-grow italic">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-200"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>

                <div className="absolute -bottom-2 -left-2 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </motion.div>
            ))}
          </div>
          {allTestimonials.length > displayCount && !showAllRatings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 text-center"
            >
              <button
                onClick={() => setShowAllRatings(true)}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                View All {allTestimonials.length} Ratings
              </button>
            </motion.div>
          )}
          </>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center space-y-6"
        >
          {testimonials.length > 0 && (
            <div className="inline-block">
              <div className="flex items-center gap-3 bg-white px-8 py-4 rounded-2xl shadow-lg border-2 border-orange-100">
                <div className="flex -space-x-2">
                  {testimonials.slice(0, 3).map((testimonial, index) => (
                    <img
                      key={index}
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                    />
                  ))}
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">{ratingsCount} {ratingsCount === 1 ? 'Rating' : 'Ratings'}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-gray-600">{averageRating.toFixed(1)}/5 Average Rating</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRatingForm(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-yellow-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Star className="w-5 h-5 fill-white" />
            Rate Our School
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {showRatingForm && (
            <PublicRatingForm onClose={() => setShowRatingForm(false)} />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TestimonialsSection;
