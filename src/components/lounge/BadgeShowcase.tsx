import { useTranslation } from 'react-i18next';
import { Award } from 'lucide-react';
import type { Badge, UserBadge } from '../../types/loyalty';

interface BadgeShowcaseProps {
  badges: Badge[];
  userBadges: UserBadge[];
}

const BadgeShowcase = ({ badges, userBadges }: BadgeShowcaseProps) => {
  const { t } = useTranslation();

  return (
    <section>
      <div className="flex items-end justify-between mb-10">
        <div>
          <h3 className="font-serif text-3xl md:text-4xl uppercase tracking-tighter mb-2">{t('lounge.archive_title')}</h3>
          <p className="font-sans text-zinc-500 dark:text-zinc-400 text-sm tracking-wide">{t('lounge.archive_subtitle')}</p>
        </div>
        <Award className="w-6 h-6 opacity-40 dark:opacity-60" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-3 md:gap-4">
          {badges.slice(0, 5).map(badge => {
            const unlocked = userBadges.some(ub => ub.badgeId === badge.id);
            return (
              <div 
                key={badge.id} 
                className={`px-4 md:px-6 py-3 md:py-4 border transition-all ${
                  unlocked ? 'border-black dark:border-white text-black dark:text-white bg-white dark:bg-[#1A1A1A]' : 'border-neutral-200 dark:border-zinc-800 text-neutral-400 dark:text-zinc-600 opacity-40 bg-white dark:bg-[#1A1A1A]'
                }`}
              >
                <div className="font-serif text-xs md:text-sm uppercase tracking-widest leading-none">{badge.name}</div>
              </div>
            );
          })}
        </div>

      <div className="mt-2">
        <a href="#" className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white border-b border-transparent hover:border-black dark:hover:border-white transition-colors font-bold">
          {t('lounge.view_collection')}
        </a>
      </div>
      </div>
    </section>
  );
};

export default BadgeShowcase;
