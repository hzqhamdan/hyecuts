import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { LoyaltyProfile } from '../../types/loyalty';

interface StatusCardProps {
  profile: LoyaltyProfile | null;
  isLoading: boolean;
  progressData: { percentage: number; nextTier: string | null };
  tierLabel: string;
}

const StatusCard = ({ profile, isLoading, progressData, tierLabel }: StatusCardProps) => {
  const { t } = useTranslation();

  return (
    <section className="lg:w-1/3 flex flex-col items-center">
      <div className="w-full max-w-sm flex flex-col items-center bg-surface-card border border-hairline px-8 py-12 md:py-16">
        <span className="text-xs uppercase tracking-[0.2em] text-ink-faint font-sans mb-4">{tierLabel}</span>
        <h2 className="font-serif text-[32px] md:text-[40px] text-black dark:text-white text-center">
          {isLoading ? '...' : t('data.tiers.' + (profile?.currentTier ?? 'MEMBER'))}
        </h2>

        {/* The Hairline Progress Arc */}
        <div className="mt-10 md:mt-12 relative w-48 h-24 overflow-hidden flex justify-center">
          <svg className="w-48 h-48 absolute top-0" viewBox="0 0 192 192">
            <path
              d="M 24 96 A 72 72 0 0 1 168 96"
              stroke="currentColor" 
              className="text-zinc-100 dark:text-zinc-800"
              strokeWidth="1"
              fill="transparent"
            />
            <motion.path
              d="M 24 96 A 72 72 0 0 1 168 96"
              stroke="currentColor" 
              className="text-black dark:text-gold"
              strokeWidth="1"
              fill="transparent"
              strokeDasharray="226.2"
              initial={{ strokeDashoffset: 226.2 }}
              animate={{ strokeDashoffset: 226.2 - (226.2 * progressData.percentage) / 100 }}
              transition={{ type: 'spring', damping: 20, stiffness: 50, duration: 0.8 }}
            />
          </svg>
        </div>
        
        <div className="mt-8 text-center">
          <p className="font-sans text-ink-muted text-sm leading-relaxed max-w-[240px]">
            {t('lounge.tier_description')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default StatusCard;
