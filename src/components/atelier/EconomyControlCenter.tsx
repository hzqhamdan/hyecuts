import { useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8081') + '/api';

interface EconomyProps {
  ratio: number;
  setRatio: (ratio: number) => void;
  multiplier: number;
  setMultiplier: (multiplier: number) => void;
}

export function EconomyControlCenter({ ratio, setRatio, multiplier, setMultiplier }: EconomyProps) {
  const [targetUser, setTargetUser] = useState('user-123');
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustStatus, setAdjustStatus] = useState('');

  const handleAdjust = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/points/adjust/${targetUser}?points=${adjustAmount}`, {
        method: 'POST'
      });
      if (res.ok) {
        setAdjustStatus('Success');
        setTimeout(() => setAdjustStatus(''), 2000);
      } else {
        setAdjustStatus('Error');
      }
    } catch(e) {
      setAdjustStatus('Error');
    }
  };

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light">Economy Center</h2>
        <p className="text-zinc-400 font-sans uppercase tracking-widest text-[11px]">Engine Calibration & Adjustments</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200">
        <div className="p-12 bg-white space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Point-per-Visit Ratio</label>
            <span className="font-serif text-3xl">{ratio} pts</span>
          </div>
          <input
            type="range"
            min="1" max="50"
            value={ratio}
            onChange={(e) => setRatio(parseInt(e.target.value))}
            className="w-full h-px bg-zinc-200 rounded-none appearance-none cursor-pointer accent-black"
          />
          <p className="text-xs text-zinc-400 leading-relaxed italic">
            Controls the baseline point accumulation for every completed visit.
          </p>
        </div>

        <div className="p-12 bg-white space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Seasonal Multiplier</label>
            <span className="font-serif text-3xl">{multiplier}x</span>
          </div>
          <input
            type="range"
            min="1" max="3" step="0.1"
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className="w-full h-px bg-zinc-200 rounded-none appearance-none cursor-pointer accent-black"
          />
          <p className="text-xs text-zinc-400 leading-relaxed italic">
            Global multiplier applied to all point earnings.
          </p>
        </div>
      </div>

      <div className="bg-white p-12 border border-zinc-200 space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Manual Point Adjustment</label>
            <span className="font-serif text-3xl">{adjustAmount > 0 ? '+' : ''}{adjustAmount}</span>
          </div>
          <div className="flex flex-col gap-4 max-w-md">
            <input 
              type="text" 
              value={targetUser} 
              onChange={e => setTargetUser(e.target.value)} 
              placeholder="User ID" 
              className="p-3 border border-zinc-200 text-sm" 
            />
            <input 
              type="number" 
              value={adjustAmount} 
              onChange={e => setAdjustAmount(parseInt(e.target.value) || 0)} 
              placeholder="Amount (+ or -)" 
              className="p-3 border border-zinc-200 text-sm" 
            />
            <button 
              onClick={handleAdjust} 
              className="w-full py-3 bg-black text-white text-[10px] uppercase tracking-widest font-bold"
            >
              Apply Adjustment {adjustStatus && `(${adjustStatus})`}
            </button>
          </div>
      </div>
    </div>
  );
}
