import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

import { api } from '../../api/client';

interface EconomyProps {
  ratio: number;
  setRatio: (ratio: number) => void;
  multiplier: number;
  setMultiplier: (multiplier: number) => void;
}

export function EconomyControlCenter({ ratio, setRatio, multiplier, setMultiplier }: EconomyProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [targetUser, setTargetUser] = useState('user-123');
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustStatus, setAdjustStatus] = useState('');

  const handleAdjust = async () => {
    try {
      await api.post(`/admin/points/adjust/${targetUser}?points=${adjustAmount.toString()}`, { token });
      setAdjustStatus(t('atelier.loyalty.success'));
      setTimeout(() => { setAdjustStatus(''); }, 2000);
    } catch {
      setAdjustStatus(t('atelier.loyalty.error'));
    }
  };

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light text-black dark:text-white">{t('atelier.loyalty.economy_title')}</h2>
        <p className="text-zinc-400 dark:text-zinc-500 font-sans uppercase tracking-widest text-[11px]">{t('atelier.loyalty.economy_subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
        <div className="p-12 bg-white dark:bg-[#1A1A1A] space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">{t('atelier.loyalty.ratio_label')}</label>
            <span className="font-serif text-3xl text-black dark:text-white">{ratio.toString()} {t('lounge.pts')}</span>
          </div>
          <input
            type="range"
            min="1" max="50"
            value={ratio}
            onChange={(e) => { setRatio(parseInt(e.target.value)); }}
            className="w-full h-px bg-zinc-200 dark:bg-zinc-800 rounded-none appearance-none cursor-pointer accent-black dark:accent-white"
          />
          <p className="text-xs text-zinc-400 dark:text-zinc-600 leading-relaxed italic">
            {t('atelier.loyalty.ratio_desc')}
          </p>
        </div>

        <div className="p-12 bg-white dark:bg-[#1A1A1A] space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">{t('atelier.loyalty.multiplier_label')}</label>
            <span className="font-serif text-3xl text-black dark:text-white">{multiplier.toString()}x</span>
          </div>
          <input
            type="range"
            min="1" max="3" step="0.1"
            value={multiplier}
            onChange={(e) => { setMultiplier(parseFloat(e.target.value)); }}
            className="w-full h-px bg-zinc-200 dark:bg-zinc-800 rounded-none appearance-none cursor-pointer accent-black dark:accent-white"
          />
          <p className="text-xs text-zinc-400 dark:text-zinc-600 leading-relaxed italic">
            {t('atelier.loyalty.multiplier_desc')}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] p-12 border border-zinc-200 dark:border-zinc-800 space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">{t('atelier.loyalty.manual_adj_label')}</label>
            <span className="font-serif text-3xl text-black dark:text-white">{adjustAmount > 0 ? '+' : ''}{adjustAmount.toString()}</span>
          </div>
          <div className="flex flex-col gap-4 max-w-md">
            <input 
              type="text" 
              value={targetUser} 
              onChange={e => { setTargetUser(e.target.value); }} 
              placeholder={t('login.identifier_label')} 
              className="p-3 border border-zinc-200 dark:border-zinc-800 bg-transparent text-black dark:text-white text-sm focus:border-black dark:focus:border-white outline-none transition-all" 
            />
            <input 
              type="number" 
              value={adjustAmount} 
              onChange={e => { setAdjustAmount(parseInt(e.target.value) || 0); }} 
              placeholder={t('atelier.loyalty.amount_placeholder', { defaultValue: 'Amount (+ or -)' })} 
              className="p-3 border border-zinc-200 dark:border-zinc-800 bg-transparent text-black dark:text-white text-sm focus:border-black dark:focus:border-white outline-none transition-all" 
            />
            <button 
              onClick={() => { void handleAdjust(); }} 
              className="w-full py-3 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
            >
              {t('atelier.loyalty.apply_adj')} {adjustStatus && `(${adjustStatus})`}
            </button>
          </div>
      </div>
    </div>
  );
}
