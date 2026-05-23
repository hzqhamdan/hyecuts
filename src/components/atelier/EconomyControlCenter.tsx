import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

import { API_BASE } from '../../config';

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
      const res = await fetch(`${API_BASE}/admin/points/adjust/${targetUser}?points=${adjustAmount.toString()}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token ?? ''}` }
      });
      if (res.ok) {
        setAdjustStatus(t('atelier.loyalty.success'));
        setTimeout(() => { setAdjustStatus(''); }, 2000);
      } else {
        setAdjustStatus(t('atelier.loyalty.error'));
      }
    } catch {
      setAdjustStatus(t('atelier.loyalty.error'));
    }
  };

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light">{t('atelier.loyalty.economy_title')}</h2>
        <p className="text-zinc-400 font-sans uppercase tracking-widest text-[11px]">{t('atelier.loyalty.economy_subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200">
        <div className="p-12 bg-white space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">{t('atelier.loyalty.ratio_label')}</label>
            <span className="font-serif text-3xl">{ratio.toString()} {t('lounge.pts')}</span>
          </div>
          <input
            type="range"
            min="1" max="50"
            value={ratio}
            onChange={(e) => { setRatio(parseInt(e.target.value)); }}
            className="w-full h-px bg-zinc-200 rounded-none appearance-none cursor-pointer accent-black"
          />
          <p className="text-xs text-zinc-400 leading-relaxed italic">
            {t('atelier.loyalty.ratio_desc')}
          </p>
        </div>

        <div className="p-12 bg-white space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">{t('atelier.loyalty.multiplier_label')}</label>
            <span className="font-serif text-3xl">{multiplier.toString()}x</span>
          </div>
          <input
            type="range"
            min="1" max="3" step="0.1"
            value={multiplier}
            onChange={(e) => { setMultiplier(parseFloat(e.target.value)); }}
            className="w-full h-px bg-zinc-200 rounded-none appearance-none cursor-pointer accent-black"
          />
          <p className="text-xs text-zinc-400 leading-relaxed italic">
            {t('atelier.loyalty.multiplier_desc')}
          </p>
        </div>
      </div>

      <div className="bg-white p-12 border border-zinc-200 space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">{t('atelier.loyalty.manual_adj_label')}</label>
            <span className="font-serif text-3xl">{adjustAmount > 0 ? '+' : ''}{adjustAmount.toString()}</span>
          </div>
          <div className="flex flex-col gap-4 max-w-md">
            <input 
              type="text" 
              value={targetUser} 
              onChange={e => { setTargetUser(e.target.value); }} 
              placeholder={t('login.identifier_label')} 
              className="p-3 border border-zinc-200 text-sm" 
            />
            <input 
              type="number" 
              value={adjustAmount} 
              onChange={e => { setAdjustAmount(parseInt(e.target.value) || 0); }} 
              placeholder="Amount (+ or -)" 
              className="p-3 border border-zinc-200 text-sm" 
            />
            <button 
              onClick={() => { void handleAdjust(); }} 
              className="w-full py-3 bg-black text-white text-[10px] uppercase tracking-widest font-bold"
            >
              {t('atelier.loyalty.apply_adj')} {adjustStatus && `(${adjustStatus})`}
            </button>
          </div>
      </div>
    </div>
  );
}
