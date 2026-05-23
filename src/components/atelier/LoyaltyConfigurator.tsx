import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE } from '../../config';
import { EconomyControlCenter } from './EconomyControlCenter';
import { RewardsInventory } from './RewardsInventory';
import type { Reward } from '../../types/loyalty';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export function LoyaltyConfigurator() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['loyalty-config'],
    queryFn: async () => {
      const authHeader = { 'Authorization': `Bearer ${token ?? ''}` };
      const [rewardsRes, ratioRes, multiRes] = await Promise.all([
        fetch(`${API_BASE}/rewards`, { headers: authHeader }),
        fetch(`${API_BASE}/admin/settings/POINTS_PER_MYR`, { headers: authHeader }),
        fetch(`${API_BASE}/admin/settings/SEASONAL_MULTIPLIER`, { headers: authHeader })
      ]);

      let rewards: Reward[] = [];
      let ratio = 10;
      let multiplier = 1.0;

      if (rewardsRes.ok) rewards = await rewardsRes.json() as Reward[];
      if (ratioRes.ok) ratio = parseInt(await ratioRes.text(), 10) || 10;
      if (multiRes.ok) multiplier = parseFloat(await multiRes.text()) || 1.0;

      return { rewards, ratio, multiplier };
    }
  });

  const ratioMutation = useMutation({
    mutationFn: async (newRatio: number) => {
      await fetch(`${API_BASE}/admin/settings?key=POINTS_PER_MYR&value=${newRatio.toString()}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token ?? ''}` }
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['loyalty-config'] });
    }
  });

  const multiMutation = useMutation({
    mutationFn: async (newMulti: number) => {
      await fetch(`${API_BASE}/admin/settings?key=SEASONAL_MULTIPLIER&value=${newMulti.toString()}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token ?? ''}` }
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['loyalty-config'] });
    }
  });

  if (isLoading || !data) {
    return <div className="p-10">{t('atelier.loyalty.loading')}</div>;
  }

  return (
    <div className="space-y-24">
      <EconomyControlCenter 
        ratio={data.ratio} 
        setRatio={(val) => { ratioMutation.mutate(val); }} 
        multiplier={data.multiplier} 
        setMultiplier={(val) => { multiMutation.mutate(val); }} 
      />
      <hr className="border-zinc-200" />
      <RewardsInventory 
        rewards={data.rewards} 
        onRewardAdded={() => { void queryClient.invalidateQueries({ queryKey: ['loyalty-config'] }); }} 
      />
    </div>
  );
}
