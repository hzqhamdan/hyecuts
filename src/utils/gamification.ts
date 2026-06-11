export function calculateLoyaltyPoints(spendMyr: number, _pointsPerMyr: number = 1, seasonalMultiplier: number = 1.0): number {
  if (spendMyr <= 0) return 0;
  return Math.floor(spendMyr * 1 * seasonalMultiplier);
}

export function determineTier(lifetimePoints: number): string {
  if (lifetimePoints >= 1500) return 'PATRON';
  if (lifetimePoints >= 750) return 'CONNOISSEUR';
  if (lifetimePoints >= 350) return 'ARTISAN';
  if (lifetimePoints >= 100) return 'INSIDER';
  return 'MEMBER';
}

export function calculateProgressToNextTier(lifetimePoints: number): { nextTier: string | null, pointsNeeded: number, progressPercentage: number } {
  const tiers = [
    { name: 'MEMBER', threshold: 0 },
    { name: 'INSIDER', threshold: 100 },
    { name: 'ARTISAN', threshold: 350 },
    { name: 'CONNOISSEUR', threshold: 750 },
    { name: 'PATRON', threshold: 1500 },
  ];

  let currentTierIndex = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (lifetimePoints >= tiers[i].threshold) {
      currentTierIndex = i;
      break;
    }
  }

  if (currentTierIndex === tiers.length - 1) {
    return { nextTier: null, pointsNeeded: 0, progressPercentage: 100 };
  }

  const nextTier = tiers[currentTierIndex + 1];
  const currentTier = tiers[currentTierIndex];
  
  const pointsNeeded = nextTier.threshold - lifetimePoints;
  const range = nextTier.threshold - currentTier.threshold;
  const progress = lifetimePoints - currentTier.threshold;
  const progressPercentage = Math.min(100, Math.max(0, Math.floor((progress / range) * 100)));

  return {
    nextTier: nextTier.name,
    pointsNeeded,
    progressPercentage
  };
}
