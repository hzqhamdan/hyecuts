import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Activity } from 'lucide-react';
import type { Reward, ActivityLog } from '../../types/loyalty';

interface RewardPortfolioProps {
  rewards: Reward[];
  isLoading: boolean;
  onSelectVoucher: (reward: Reward) => void;
  activities: ActivityLog[];
}

export const RewardPortfolio = ({ rewards, isLoading, onSelectVoucher, activities }: RewardPortfolioProps) => {
  return (
    <section className="lg:w-2/3">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h3 className="font-display text-4xl uppercase tracking-tighter mb-2">The Portfolio</h3>
          <p className="font-sans text-luxury-slate text-sm tracking-wide">Curated rewards and invitations</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium uppercase tracking-widest border-b border-luxury-black pb-1">
            {rewards.length} Available Assets
          </span>
        </div>
      </div>

      {/* Editorial Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
        {isLoading ? (
          <div className="col-span-2 text-center py-12 text-luxury-slate text-[10px] uppercase tracking-widest">
            Retrieving Secure Assets...
          </div>
        ) : rewards.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-luxury-slate text-[10px] uppercase tracking-widest">
            No Assets Available
          </div>
        ) : rewards.map((reward, idx) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15 }}
            className="relative group cursor-pointer"
            onClick={() => onSelectVoucher(reward)}
          >
            <div className="relative overflow-hidden aspect-[1.6/1] bg-white border border-black/10 p-8 flex flex-col justify-between transition-all duration-500 group-hover:shadow-xl group-hover:border-black">
              {/* Top Row */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-luxury-black rounded-full" />
                  <span className="text-[9px] uppercase tracking-widest font-medium">
                    {reward.minimumTierRequired || 'Any'} Tier
                  </span>
                </div>
                <Sparkles className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Middle Content Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
                <div className="bg-luxury-black text-white px-4 py-2 text-[10px] uppercase tracking-widest flex items-center gap-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
                  Reveal Invitation <ChevronRight className="w-3 h-3" />
                </div>
              </div>

              <div className="relative z-10">
                <h4 className="font-display text-xl uppercase tracking-tight mb-2 group-hover:translate-x-1 transition-transform duration-300">
                  {reward.title}
                </h4>
                <p className="text-xs text-luxury-slate font-sans leading-relaxed max-w-xs line-clamp-2 mb-3">
                  {reward.description}
                </p>
                <div className="font-mono text-[10px] tracking-widest text-luxury-slate uppercase">
                  {reward.pointsCost} PTS {reward.stockAvailable !== null && `• ${reward.stockAvailable} Left`}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Recent Activity Feed */}
      {activities.length > 0 && (
        <div className="mt-24">
          <h3 className="font-display text-2xl uppercase tracking-tighter mb-8 border-b border-black/10 pb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activities.slice(0, 3).map((act) => (
              <div key={act.id} className="flex justify-between items-center p-4 bg-neutral-50 border border-neutral-100">
                <div className="flex items-center gap-4">
                  <Activity className="w-4 h-4 text-luxury-slate" />
                  <div>
                    <p className="text-sm font-medium">{act.description}</p>
                    <p className="text-[10px] text-luxury-slate uppercase tracking-widest mt-1">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`font-mono text-sm ${act.pointsEarned > 0 ? 'text-green-600' : 'text-luxury-slate'}`}>
                  {act.pointsEarned > 0 ? '+' : ''}{act.pointsEarned} PTS
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
