import { useState } from 'react';
import type { Reward } from '../../types/loyalty';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

import { api } from '../../api/client';

export function RewardsInventory({ rewards, onRewardAdded }: { rewards: Reward[], onRewardAdded: () => void }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [newReward, setNewReward] = useState({ 
    title: '', 
    pointsCost: 1000, 
    type: 'SERVICE_DISCOUNT', 
    minimumTierRequired: 'Rookie', 
    stockAvailable: 10 
  });

  const handleAddAsset = async () => {
    try {
      await api.post('/rewards', { body: newReward, token: token ?? undefined });
      onRewardAdded();
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light text-black dark:text-white">{t('atelier.loyalty.inventory_title')}</h2>
          <p className="text-zinc-400 dark:text-zinc-500 font-sans uppercase tracking-widest text-[11px]">{t('atelier.loyalty.inventory_subtitle')}</p>
        </div>
        <button 
          onClick={() => { setIsAdding(!isAdding); }}
          className="px-8 py-3 border border-black dark:border-white text-black dark:text-white text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
          {isAdding ? t('atelier.loyalty.cancel') : t('atelier.loyalty.add_reward')}
        </button>
      </header>

      {isAdding && (
        <div className="p-8 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-black dark:text-white">{t('atelier.loyalty.register_asset')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Title" value={newReward.title} onChange={e => { setNewReward({...newReward, title: e.target.value}); }} className="p-3 border border-zinc-200 dark:border-zinc-800 bg-transparent text-black dark:text-white text-sm outline-none focus:border-black dark:focus:border-white transition-all" />
            <input type="number" placeholder={t('atelier.loyalty.valuation')} value={newReward.pointsCost} onChange={e => { setNewReward({...newReward, pointsCost: parseInt(e.target.value)}); }} className="p-3 border border-zinc-200 dark:border-zinc-800 bg-transparent text-black dark:text-white text-sm outline-none focus:border-black dark:focus:border-white transition-all" />
            <select value={newReward.minimumTierRequired} onChange={e => { setNewReward({...newReward, minimumTierRequired: e.target.value}); }} className="p-3 border border-zinc-200 dark:border-zinc-800 bg-transparent text-black dark:text-white text-sm outline-none focus:border-black dark:focus:border-white transition-all">
              <option value="Rookie" className="bg-white dark:bg-[#1A1A1A]">{t('data.tiers.Rookie')}</option>
              <option value="Regular" className="bg-white dark:bg-[#1A1A1A]">{t('data.tiers.Regular')}</option>
              <option value="Legend" className="bg-white dark:bg-[#1A1A1A]">{t('data.tiers.Legend')}</option>
              <option value="Master" className="bg-white dark:bg-[#1A1A1A]">{t('data.tiers.Master')}</option>
              <option value="Icon" className="bg-white dark:bg-[#1A1A1A]">{t('data.tiers.Icon')}</option>
            </select>
            <input type="number" placeholder={t('atelier.loyalty.stock')} value={newReward.stockAvailable} onChange={e => { setNewReward({...newReward, stockAvailable: parseInt(e.target.value)}); }} className="p-3 border border-zinc-200 dark:border-zinc-800 bg-transparent text-black dark:text-white text-sm outline-none focus:border-black dark:focus:border-white transition-all" />
          </div>
          <button onClick={() => { void handleAddAsset(); }} className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">{t('atelier.loyalty.save_asset')}</button>
        </div>
      )}

      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
              <th className="p-6">{t('atelier.loyalty.asset_id')}</th>
              <th className="p-6">{t('atelier.loyalty.reward_name')}</th>
              <th className="p-6">{t('atelier.loyalty.valuation')}</th>
              <th className="p-6">{t('atelier.loyalty.stock')}</th>
              <th className="p-6">{t('atelier.loyalty.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 bg-white dark:bg-[#1A1A1A]">
            {rewards.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group cursor-pointer">
                <td className="p-6 font-mono text-xs text-zinc-400 dark:text-zinc-500">{item.id.toString()}</td>
                <td className="p-6 font-medium text-sm text-black dark:text-white">{t(`data.rewards.${item.title}.title`, { defaultValue: item.title })}</td>
                <td className="p-6 text-sm text-zinc-400 dark:text-zinc-500">{item.pointsCost.toString()} {t('lounge.pts')}</td>
                <td className="p-6 text-sm text-zinc-400 dark:text-zinc-500">{item.stockAvailable?.toString() ?? t('atelier.loyalty.unlimited')}</td>
                <td className="p-6">
                  <span className="text-[9px] uppercase tracking-tighter px-2 py-1 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold">
                    {t(`data.tiers.${item.minimumTierRequired}`, { defaultValue: item.minimumTierRequired })} Tier
                  </span>
                </td>
              </tr>
            ))}
            {rewards.length === 0 && (
              <tr><td colSpan={5} className="p-20 text-center text-sm text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold bg-white dark:bg-[#1A1A1A]">{t('atelier.loyalty.no_assets')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
