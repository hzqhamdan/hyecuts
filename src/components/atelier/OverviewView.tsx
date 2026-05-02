import { useState, useEffect } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8081') + '/api';

export function OverviewView() {
  const [stats, setStats] = useState({ redemptions: 0, activeRewards: 0 });

  useEffect(() => {
    fetch(`${API_BASE}/rewards`)
      .then(r => r.json())
      .then(d => setStats(s => ({...s, activeRewards: d.length})));
  }, []);

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light tracking-tight">Atelier Overview</h2>
        <p className="text-zinc-400 font-sans max-w-md leading-relaxed">Welcome back, Curator. The ecosystem is balanced and the assets are primed.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-200 border border-zinc-200">
        {[
          { label: 'Total Redemptions', value: stats.redemptions.toString(), trend: '+12%' },
          { label: 'Active Rewards', value: stats.activeRewards.toString(), trend: 'Stable' },
          { label: 'Economy Velocity', value: '8.4x', trend: '+2.1%' },
        ].map((stat, i) => (
          <div key={i} className="p-10 bg-white hover:bg-zinc-50 transition-colors">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-6">{stat.label}</p>
            <div className="flex justify-between items-end">
              <h3 className="font-serif text-4xl font-light">{stat.value}</h3>
              <span className="text-xs font-medium px-2 py-1 bg-black text-white rounded-none">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
