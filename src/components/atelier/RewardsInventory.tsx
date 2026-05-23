import { useState } from 'react';
import type { Reward } from '../../types/loyalty';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

import { API_BASE } from '../../config';

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
      const res = await fetch(`${API_BASE}/rewards`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token ?? ''}`
        },
        body: JSON.stringify(newReward)
      });
      if (res.ok) {
        onRewardAdded();
        setIsAdding(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light">{t('atelier.loyalty.inventory_title')}</h2>
          <p className="text-zinc-400 font-sans uppercase tracking-widest text-[11px]">{t('atelier.loyalty.inventory_subtitle')}</p>
        </div>
        <button 
          onClick={() => { setIsAdding(!isAdding); }}
          className="px-8 py-3 border border-black text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all">
          {isAdding ? t('atelier.loyalty.cancel') : t('atelier.loyalty.add_reward')}
        </button>
      </header>

      {isAdding && (
        <div className="p-8 border border-zinc-200 bg-zinc-50 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest">{t('atelier.loyalty.register_asset')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Title" value={newReward.title} onChange={e => { setNewReward({...newReward, title: e.target.value}); }} className="p-3 border border-zinc-200 text-sm" />
            <input type="number" placeholder={t('atelier.loyalty.valuation')} value={newReward.pointsCost} onChange={e => { setNewReward({...newReward, pointsCost: parseInt(e.target.value)}); }} className="p-3 border border-zinc-200 text-sm" />
            <select value={newReward.minimumTierRequired} onChange={e => { setNewReward({...newReward, minimumTierRequired: e.target.value}); }} className="p-3 border border-zinc-200 text-sm">
              <option value="Rookie">{t('data.tiers.Rookie')}</option>
              <option value="Regular">{t('data.tiers.Regular')}</option>
              <option value="Legend">{t('data.tiers.Legend')}</option>
              <option value="Master">{t('data.tiers.Master')}</option>
              <option value="Icon">{t('data.tiers.Icon')}</option>
            </select>
            <input type="number" placeholder={t('atelier.loyalty.stock')} value={newReward.stockAvailable} onChange={e => { setNewReward({...newReward, stockAvailable: parseInt(e.target.value)}); }} className="p-3 border border-zinc-200 text-sm" />
          </div>
          <button onClick={() => { void handleAddAsset(); }} className="bg-black text-white px-8 py-3 text-[10px] uppercase tracking-widest font-bold">{t('atelier.loyalty.save_asset')}</button>
        </div>
      )}

      <div className="overflow-x-auto border border-zinc-200">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
              <th className="p-6">{t('atelier.loyalty.asset_id')}</th>
              <th className="p-6">{t('atelier.loyalty.reward_name')}</th>
              <th className="p-6">{t('atelier.loyalty.valuation')}</th>
              <th className="p-6">{t('atelier.loyalty.stock')}</th>
              <th className="p-6">{t('atelier.loyalty.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rewards.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                <td className="p-6 font-mono text-xs text-zinc-400">{item.id.toString()}</td>
                <td className="p-6 font-medium text-sm">{t(`data.rewards.${item.title}.title`, { defaultValue: item.title })}</td>
                <td className="p-6 text-sm text-zinc-400">{item.pointsCost.toString()} {t('lounge.pts')}</td>
                <td className="p-6 text-sm text-zinc-400">{item.stockAvailable?.toString() ?? t('atelier.loyalty.unlimited')}</td>
                <td className="p-6">
                  <span className="text-[9px] uppercase tracking-tighter px-2 py-1 border border-zinc-200 text-zinc-500 font-bold">
                    {t(`data.tiers.${item.minimumTierRequired}`, { defaultValue: item.minimumTierRequired })} Tier
                  </span>
                </td>
              </tr>
            ))}
            {rewards.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-sm text-zinc-400">{t('atelier.loyalty.no_assets')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
