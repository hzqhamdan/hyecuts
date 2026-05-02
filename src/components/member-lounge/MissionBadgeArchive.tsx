import { Target, Award } from 'lucide-react';
import type { Mission, UserMissionProgress, Badge, UserBadge } from '../../types/loyalty';

interface MissionBadgeArchiveProps {
  missions: Mission[];
  missionProgress: UserMissionProgress[];
  badges: Badge[];
  userBadges: UserBadge[];
}

export const MissionBadgeArchive = ({ missions, missionProgress, badges, userBadges }: MissionBadgeArchiveProps) => {
  return (
    <div className="max-w-7xl mx-auto mt-32 grid grid-cols-1 lg:grid-cols-2 gap-20 border-t border-black/10 pt-24">
      
      {/* Active Missions */}
      <section>
        <div className="flex items-end justify-between mb-12">
          <div>
            <h3 className="font-display text-4xl uppercase tracking-tighter mb-2">Directives</h3>
            <p className="font-sans text-neutral-500 text-sm tracking-wide">Active challenges & objectives</p>
          </div>
          <Target className="w-6 h-6 opacity-40" />
        </div>

        <div className="space-y-6">
          {missions.length === 0 ? (
            <div className="text-[10px] uppercase tracking-widest text-neutral-400">No active directives.</div>
          ) : (
            missions.map(mission => {
              const prog = missionProgress.find(p => p.missionId === mission.id) || { currentProgress: 0, completed: false };
              const percent = Math.min(100, (prog.currentProgress / mission.requiredCount) * 100);

              return (
                <div key={mission.id} className="p-6 border border-black/10 flex flex-col gap-4 bg-white hover:border-black transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[9px] uppercase tracking-widest font-bold mb-1 text-neutral-400">{mission.type}</div>
                      <h4 className="font-display text-lg uppercase tracking-tight leading-tight">{mission.title}</h4>
                      <p className="text-xs text-neutral-500 font-sans mt-2">{mission.description}</p>
                    </div>
                    <span className="text-[10px] font-mono tracking-widest bg-neutral-100 px-3 py-1 text-black font-bold">
                      +{mission.rewardPoints} PTS
                    </span>
                  </div>
                  <div className="w-full h-1 bg-neutral-100 mt-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-black transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] uppercase tracking-widest font-mono text-neutral-500">
                    <span>{prog.currentProgress} / {mission.requiredCount} {mission.targetAction}</span>
                    <span className={prog.completed ? 'text-green-600 font-bold' : ''}>
                      {prog.completed ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Badge Showcase */}
      <section>
        <div className="flex items-end justify-between mb-12">
          <div>
            <h3 className="font-display text-4xl uppercase tracking-tighter mb-2">The Archive</h3>
            <p className="font-sans text-neutral-500 text-sm tracking-wide">Honors and achievements</p>
          </div>
          <Award className="w-6 h-6 opacity-40" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {badges.length === 0 ? (
            <div className="col-span-3 text-[10px] uppercase tracking-widest text-neutral-400">No honors registered.</div>
          ) : (
            badges.map(badge => {
              const unlocked = userBadges.some(ub => ub.badgeId === badge.id);
              return (
                <div 
                  key={badge.id} 
                  className={`aspect-square p-6 border flex flex-col items-center justify-center gap-4 text-center transition-all ${
                    unlocked ? 'border-black text-black bg-neutral-50' : 'border-neutral-200 text-neutral-400 opacity-40 bg-white'
                  }`}
                >
                  <Award className="w-8 h-8" />
                  <div>
                    <div className="font-display text-sm uppercase tracking-widest leading-none mb-2">{badge.name}</div>
                    <div className="text-[8px] uppercase tracking-widest leading-relaxed line-clamp-2">{badge.description}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
