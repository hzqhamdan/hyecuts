import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Star, MessageSquare, ShieldCheck, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Review {
  id: string;
  user: {
    fullName: string;
    email: string;
  };
  rating: number;
  comment: string;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function ReviewQueue({ token: _token }: { token: string }) {
  const { t } = useTranslation();
  
  // Mock data for prototype
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 'rev-1',
      user: { fullName: 'Ahmad Daniel', email: 'ahmad@example.com' },
      rating: 5,
      comment: 'Best cut I ever had. Haiqal really knows what he is doing. The ambiance is top notch.',
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    },
    {
      id: 'rev-2',
      user: { fullName: 'Sarah Tan', email: 'sarah@example.com' },
      rating: 4,
      comment: 'Great service, but had to wait 10 mins even with booking. Overall good experience.',
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    }
  ]);

  const handleAction = (id: string, _status: 'APPROVED' | 'REJECTED') => {
    setReviews(reviews.filter(r => r.id !== id));
    // In real app, call API to update status and award points
  };

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-5xl mb-4 font-light text-black dark:text-white">{t('atelier.nav.reviews', { defaultValue: 'Review Queue' })}</h2>
        <p className="text-zinc-400 dark:text-zinc-500 font-sans uppercase tracking-widest text-[11px]">{t('atelier.reviews.subtitle', { defaultValue: 'Post-Service Feedback & Asset Validation' })}</p>
      </header>

      <div className="space-y-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
        <AnimatePresence mode="popLayout">
          {reviews.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-20 bg-white dark:bg-[#1A1A1A] text-center text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-xs"
            >
              {t('atelier.reviews.no_pending', { defaultValue: 'No pending reviews for validation.' })}
            </motion.div>
          ) : (
            reviews.map(review => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-10 bg-white dark:bg-[#1A1A1A] flex flex-col md:flex-row gap-12 group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <div className="flex-1 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                        <User size={24} />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl italic text-black dark:text-white">{review.user.fullName}</h3>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-tight font-bold">{review.user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 text-[#B8A070]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <MessageSquare className="absolute -left-8 top-0 text-zinc-100 dark:text-zinc-900" size={48} />
                    <p className="relative z-10 text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
                    <span className="flex items-center gap-2"><ShieldCheck size={12} className="text-[#B8A070]" /> {t('atelier.reviews.pending_validation', { defaultValue: 'Pending Validation' })}</span>
                    <span>•</span>
                    <span>{new Date(review.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex md:flex-col justify-center gap-4">
                  <button 
                    onClick={() => handleAction(review.id, 'APPROVED')}
                    className="w-full md:w-48 py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-3"
                  >
                    <Check size={14} /> {t('atelier.reviews.approve', { defaultValue: 'Approve (+25 pts)' })}
                  </button>
                  <button 
                    onClick={() => handleAction(review.id, 'REJECTED')}
                    className="w-full md:w-48 py-4 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold hover:border-red-200 dark:hover:border-red-900 hover:text-red-500 dark:hover:text-red-400 transition-all flex items-center justify-center gap-3"
                  >
                    <X size={14} /> {t('atelier.reviews.reject', { defaultValue: 'Reject' })}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
