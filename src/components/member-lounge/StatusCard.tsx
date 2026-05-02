import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import type { User } from '../../types/loyalty';

interface StatusCardProps {
  profile: User | null;
  isLoading: boolean;
  progressData: {
    percentage: number;
    nextTier: string;
  };
}

export const StatusCard = ({ profile, isLoading, progressData }: StatusCardProps) => {
  return (
    <section className="lg:w-1/3 flex flex-col items-center">
      <div className="relative group">
        {/* Ambient Glow Effect */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-luxury-slate/20 to-transparent blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative w-80 h-[460px] bg-gradient-to-br from-neutral-900 via-neutral-800 to-black rounded-3xl p-8 text-white shadow-2xl overflow-hidden flex flex-col justify-between border border-white/10"
          style={{ perspective: '1000px' }}
        >
          {/* Metallic Texture Overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />

          <div className="relative z-10 flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest opacity-50 font-sans">Membership Tier</span>
              <h2 className="font-display text-3xl uppercase tracking-tight mt-1">
                {isLoading ? '...' : profile?.currentTier || 'Rookie'}
              </h2>
            </div>
            <ShieldCheck className="w-6 h-6 opacity-80" />
          </div>

          {/* The Status Halo / Progress Ring */}
          <div className="relative z-10 flex justify-center py-12">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Outer Multi-layered Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96" cy="96" r="90"
                  stroke="currentColor" strokeWidth="1"
                  fill="transparent"
                  className="text-white/10"
                />
                <circle
                  cx="96" cy="96" r="90"
                  stroke="currentColor" strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={565}
                  strokeDashoffset={565 - (565 * progressData.percentage) / 100}
                  className="text-white transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center mt-3">
                <span className="font-serif text-5xl font-light tracking-tighter">
                  {isLoading ? '...' : profile?.pointsBalance || 0}
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] opacity-40 mt-1 text-center leading-tight">
                  to {progressData.nextTier}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="text-center text-[10px] uppercase tracking-[0.3em] opacity-30 pt-6 border-t border-white/10">
              Certified Hyecuts Elite
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-12 text-center max-w-xs">
        <p className="font-sans text-luxury-slate text-xs leading-relaxed italic">
          "The pinnacle of grooming. Your status grants you access to the most refined services in the city."
        </p>
      </div>
    </section>
  );
};
