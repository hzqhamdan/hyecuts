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

const COLORS = ['#1A1A1A', '#B8A070', '#6B6B6B', '#FAFAFA', '#D4C4A8'];

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
        <div className="h-20 bg-zinc-100 w-1/3"></div>
        <div className="grid grid-cols-3 gap-px bg-zinc-200 border border-zinc-200">
          <div className="h-40 bg-white"></div>
          <div className="h-40 bg-white"></div>
          <div className="h-40 bg-white"></div>
        </div>
        <div className="h-96 bg-zinc-50"></div>
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
        <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light tracking-tight">{t('atelier.overview.title')}</h2>
        <p className="text-zinc-400 font-sans max-w-md leading-relaxed">{t('atelier.overview.welcome')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-200 border border-zinc-200">
        {[
          { label: t('atelier.overview.total_redemptions'), value: stats.redemptions.toString(), trend: '+12%' },
          { label: t('atelier.overview.active_rewards'), value: stats.activeRewards.toString(), trend: t('atelier.overview.stable') },
          { label: t('atelier.overview.economy_velocity'), value: '8.4x', trend: '+2.1%' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="bg-white border border-zinc-100 p-8 space-y-8">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{t('atelier.overview.revenue_volume')}</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
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
                  contentStyle={{borderRadius: '0', border: '1px solid #E4E4E7', fontFamily: 'Inter'}}
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
                  stroke="#1A1A1A" 
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 4, stroke: '#1A1A1A', strokeWidth: 2, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-zinc-100 p-8 space-y-8">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{t('atelier.overview.tier_distribution')}</h4>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  />
                  <Tooltip contentStyle={{borderRadius: '0', border: '1px solid #E4E4E7'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 p-8 space-y-8">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{t('atelier.overview.service_popularity')}</h4>
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
                  <Tooltip contentStyle={{borderRadius: '0', border: '1px solid #E4E4E7'}} cursor={{fill: '#F9F9F9'}} />
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
