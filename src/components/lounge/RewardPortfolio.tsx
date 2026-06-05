import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Reward } from '../../types/loyalty';

interface RewardPortfolioProps {
  rewards: Reward[];
  isLoading: boolean;
  onRedeem: (reward: Reward) => void;
}

const RewardPortfolio = ({ rewards, isLoading, onRedeem }: RewardPortfolioProps) => {
  const { t } = useTranslation();

  return (
    <section className="lg:w-2/3">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <h3 className="font-serif text-3xl md:text-4xl uppercase tracking-tighter mb-2">{t('lounge.portfolio_title')}</h3>
          <p className="font-sans text-zinc-500 dark:text-zinc-400 text-sm tracking-wide">{t('lounge.portfolio_subtitle')}</p>
        </div>
        <div className="sm:text-right">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest border-b border-black dark:border-white pb-1">
            {rewards.length} {t('lounge.available_assets')}
          </span>
        </div>
      </div>

      {/* Editorial Layout Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 md:gap-x-12 gap-y-10 md:gap-y-16">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-widest">
            {t('lounge.retrieving_assets')}
          </div>
        ) : rewards.length === 0 ? (
          <div className="col-span-full text-center py-12 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-widest">
            {t('lounge.no_rewards')}
          </div>
        ) : rewards.map((reward, idx) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative group cursor-pointer"
            onClick={() => { onRedeem(reward); }}
          >
            <div className="relative overflow-hidden aspect-[1.6/1] bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 p-6 md:p-8 flex flex-col justify-between transition-all duration-500 group-hover:shadow-xl dark:group-hover:shadow-black/50 group-hover:border-black dark:group-hover:border-white">
              {/* Top Row */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full" />
                  <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold">
                    {reward.minimumTierRequired ? `${t('data.tiers.' + reward.minimumTierRequired)} ` : ''}{t('lounge.any_tier')} Tier
                  </span>
                </div>
                <Sparkles className="w-4 h-4 opacity-20 dark:opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Middle Content Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
                <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-[10px] uppercase tracking-widest flex items-center gap-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-700 font-bold">
                  {t('lounge.reveal_invitation')} <ChevronRight className="w-3 h-3" />
                </div>
              </div>

              <div className="relative z-10">
                <h4 className="font-serif text-lg md:text-xl uppercase tracking-tight mb-2 group-hover:translate-x-1 transition-transform duration-300">
                  {t(`data.rewards.${reward.title}.title`, { defaultValue: reward.title })}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed max-w-xs line-clamp-2 mb-3">
                  {t(`data.rewards.${reward.title}.description`, { defaultValue: reward.description })}
                </p>
                <div className="font-mono text-[9px] md:text-[10px] tracking-widest text-zinc-500 dark:text-zinc-500 uppercase font-bold">
                  {(reward.pointsCost ?? 0).toString()} {t('lounge.pts')} {reward.stockAvailable !== null && `• ${(reward.stockAvailable ?? 0).toString()} ${t('lounge.left')}`}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default RewardPortfolio;
