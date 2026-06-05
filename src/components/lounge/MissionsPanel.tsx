import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { Mission, UserMissionProgress } from '../../types/loyalty';

interface MissionsPanelProps {
  missions: Mission[];
  missionProgress: UserMissionProgress[];
}

const MissionsPanel = ({ missions, missionProgress }: MissionsPanelProps) => {
  const { t } = useTranslation();

  return (
    <section>
      <div className="flex items-end justify-between mb-10">
        <div>
          <h3 className="font-serif text-3xl md:text-4xl uppercase tracking-tighter mb-2">{t('lounge.directives_title')}</h3>
          <p className="font-sans text-zinc-500 dark:text-zinc-400 text-sm tracking-wide">{t('lounge.directives_subtitle')}</p>
        </div>
        <Target className="w-6 h-6 opacity-40 dark:opacity-60" />
      </div>

      <div className="space-y-4">
        {missions.length === 0 ? (
          <div className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-500">{t('lounge.no_directives')}</div>
        ) : (
          missions.slice(0, 3).map(mission => {
            const prog = missionProgress.find(p => p.missionId === mission.id) ?? { currentProgress: 0, completed: false };

            return (
                <div key={mission.id} className="py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center group">
                  <div className={`flex items-start gap-4 ${prog.completed ? 'opacity-30' : ''} w-full`}>
                    <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1 w-full max-w-xs">
                      <h4 className={`font-sans text-xs md:text-sm uppercase tracking-widest font-bold text-black dark:text-white ${prog.completed ? 'line-through' : ''}`}>
                        {mission.title}
                      </h4>
                      {!prog.completed && (
                        <div className="mt-3">
                          <div className="w-full h-1 bg-neutral-200 dark:bg-zinc-800 overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, ((prog.currentProgress ?? 0) / (mission.requiredCount || 1)) * 100)}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                              className="absolute top-0 left-0 h-full bg-black dark:bg-[#B8A070]"
                            />
                          </div>
                          <div className="text-[9px] md:text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-2 flex justify-between items-center font-bold">
                            <span>{(prog.currentProgress ?? 0).toString()} / {(mission.requiredCount ?? 0).toString()} {mission.targetAction}</span>
                            <span className="font-mono text-black dark:text-white">+{(mission.rewardPoints ?? 0).toString()} {t('lounge.pts')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default MissionsPanel;
