import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
import type { ActivityLog } from '../../types/loyalty';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

const ActivityFeed = ({ activities }: ActivityFeedProps) => {
  const { t } = useTranslation();

  return (
    <>
      {activities.length > 0 && (
        <div className="mt-20 md:mt-24">
          <h3 className="font-serif text-xl md:text-2xl uppercase tracking-tighter mb-8 border-b border-black/10 dark:border-white/10 pb-4">{t('lounge.activity_title')}</h3>
          <div className="space-y-3">
            {activities.slice(0, 3).map((act) => (
              <div key={act.id} className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 transition-colors">
                <div className="flex items-center gap-4">
                  <Activity className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <div>
                    <p className="text-xs md:text-sm font-bold">{act.description}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mt-1">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`font-mono text-xs md:text-sm font-bold ${act.pointsEarned > 0 ? 'text-green-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  {act.pointsEarned > 0 ? '+' : ''}{act.pointsEarned.toString()} {t('lounge.pts')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ActivityFeed;
