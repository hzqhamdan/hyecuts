import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, BarChart, Bar 
} from 'recharts';
import { API_BASE } from '../../config';
import type { Reward } from '../../types/loyalty';
import { useTranslation } from 'react-i18next';

interface Analytics {
  tierDistribution: Record<string, number>;
  servicePopularity: Record<string, number>;
  dailyData: {
    date: string;
    revenue: number;
    appointments: number;
  }[];
}

const COLORS = ['#B8A070', '#6B6B6B', '#D4C4A8', '#8A8A8A', '#4A4A4A'];

export function OverviewView() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ redemptions: 0, activeRewards: 0 });
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/rewards`).then(r => r.json() as Promise<Reward[]>),
      fetch(`${API_BASE}/analytics/summary`).then(r => r.json() as Promise<Analytics>)
    ])
    .then(([rewards, summary]) => {
      setStats(s => ({...s, activeRewards: rewards.length}));
      setAnalytics(summary);
      setLoading(false);
    })
    .catch((err: unknown) => {
      console.error("Failed to fetch analytics", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-16 animate-pulse">
        <div className="h-20 bg-zinc-100 dark:bg-zinc-800 w-1/3"></div>
        <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
          <div className="h-40 bg-white dark:bg-[#1A1A1A]"></div>
          <div className="h-40 bg-white dark:bg-[#1A1A1A]"></div>
          <div className="h-40 bg-white dark:bg-[#1A1A1A]"></div>
        </div>
        <div className="h-96 bg-zinc-50 dark:bg-zinc-900/50"></div>
      </div>
    );
  }

  const tierData = analytics ? Object.entries(analytics.tierDistribution).map(([name, value], index) => ({ 
    name: t(`data.tiers.${name}`, { defaultValue: name }), 
    value,
    fill: COLORS[index % COLORS.length]
  })) : [];
  const serviceData = analytics ? Object.entries(analytics.servicePopularity).map(([name, value]) => ({ 
    name: t(`data.services.${name}`, { defaultValue: name }), 
    value 
  })) : [];

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light tracking-tight text-black dark:text-white">{t('atelier.overview.title')}</h2>
        <p className="text-zinc-400 dark:text-zinc-500 font-sans max-w-md leading-relaxed">{t('atelier.overview.welcome')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
        {[
          { label: t('atelier.overview.total_redemptions'), value: stats.redemptions.toString(), trend: '+12%' },
          { label: t('atelier.overview.active_rewards'), value: stats.activeRewards.toString(), trend: t('atelier.overview.stable') },
          { label: t('atelier.overview.economy_velocity'), value: '8.4x', trend: '+2.1%' },
        ].map((stat, i) => (
          <div key={i} className="p-10 bg-white dark:bg-[#1A1A1A] hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-6 group-hover:text-[#B8A070] transition-colors">{stat.label}</p>
            <div className="flex justify-between items-end">
              <h3 className="font-serif text-4xl font-light text-black dark:text-white">{stat.value}</h3>
              <span className="text-xs font-medium px-2 py-1 bg-black dark:bg-white text-white dark:text-black rounded-none">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-100 dark:border-zinc-800 p-8 space-y-8">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold">{t('atelier.overview.revenue_volume')}</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 10, fill: '#6B6B6B'}} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val: string) => val.split('-').slice(1).join('/')}
                />
                <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#6B6B6B'}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#6B6B6B'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '0', border: '1px solid #E4E4E7', backgroundColor: 'var(--tw-bg-opacity, #fff)', fontFamily: 'Inter'}}
                  itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#B8A070" 
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 4, stroke: '#B8A070', strokeWidth: 2, fill: 'white' }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="currentColor" 
                  className="text-black dark:text-white"
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 4, stroke: 'currentColor', strokeWidth: 2, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-100 dark:border-zinc-800 p-8 space-y-8">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold">{t('atelier.overview.tier_distribution')}</h4>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  />
                  <Tooltip contentStyle={{borderRadius: '0', border: '1px solid #E4E4E7'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-100 dark:border-zinc-800 p-8 space-y-8">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-bold">{t('atelier.overview.service_popularity')}</h4>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{fontSize: 10, fill: '#6B6B6B'}} 
                    axisLine={false} 
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip contentStyle={{borderRadius: '0', border: '1px solid #E4E4E7'}} cursor={{fill: 'currentColor', className: 'text-zinc-50 dark:text-zinc-900'}} />
                  <Bar dataKey="value" fill="#B8A070" radius={[0, 2, 2, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
