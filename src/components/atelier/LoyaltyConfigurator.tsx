import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
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
      const [rewards, ratio, multiplier] = await Promise.all([
        api.get<Reward[]>('/rewards', { token }),
        api.get<string>('/admin/settings/POINTS_PER_MYR', { token }),
        api.get<string>('/admin/settings/SEASONAL_MULTIPLIER', { token })
      ]);

      return {
        rewards,
        ratio: parseInt(ratio, 10) || 10,
        multiplier: parseFloat(multiplier) || 1.0
      };
    }
  });

  const ratioMutation = useMutation({
    mutationFn: (newRatio: number) =>
      api.post(`/admin/settings?key=POINTS_PER_MYR&value=${newRatio.toString()}`, { token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['loyalty-config'] });
    }
  });

  const multiMutation = useMutation({
    mutationFn: (newMulti: number) =>
      api.post(`/admin/settings?key=SEASONAL_MULTIPLIER&value=${newMulti.toString()}`, { token }),
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
