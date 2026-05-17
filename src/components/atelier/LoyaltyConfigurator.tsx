import { useEffect, useState } from 'react';
import { API_BASE } from '../../config';
import { EconomyControlCenter } from './EconomyControlCenter';
import { RewardsInventory } from './RewardsInventory';
import type { Reward } from '../../types/loyalty';
import { useAuth } from '../../context/AuthContext';

export function LoyaltyConfigurator() {
  const { token } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [ratio, setRatio] = useState(10);
  const [multiplier, setMultiplier] = useState(1.0);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const [rewardsRes, ratioRes, multiRes] = await Promise.all([
        fetch(`${API_BASE}/rewards`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/settings/POINTS_PER_MYR`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/settings/SEASONAL_MULTIPLIER`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (rewardsRes.ok) {
        setRewards(await rewardsRes.json());
      }
      
      if (ratioRes.ok) {
        const val = await ratioRes.text();
        setRatio(parseInt(val, 10) || 10);
      }

      if (multiRes.ok) {
        const val = await multiRes.text();
        setMultiplier(parseFloat(val) || 1.0);
      }
    } catch (e) {
      console.error('Error fetching loyalty config', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const updateRatio = async (newRatio: number) => {
    setRatio(newRatio);
    try {
      await fetch(`${API_BASE}/admin/settings?key=POINTS_PER_MYR&value=${newRatio}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) { console.error(e); }
  };

  const updateMultiplier = async (newMulti: number) => {
    setMultiplier(newMulti);
    try {
      await fetch(`${API_BASE}/admin/settings?key=SEASONAL_MULTIPLIER&value=${newMulti}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <div className="p-10">Loading configuration...</div>;
  }

  return (
    <div className="space-y-24">
      <EconomyControlCenter 
        ratio={ratio} 
        setRatio={updateRatio} 
        multiplier={multiplier} 
        setMultiplier={updateMultiplier} 
      />
      <hr className="border-zinc-200" />
      <RewardsInventory 
        rewards={rewards} 
        setRewards={setRewards} 
      />
    </div>
  );
}
