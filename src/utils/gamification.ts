export function calculateLoyaltyPoints(spendMyr: number, pointsPerMyr: number, seasonalMultiplier: number = 1.0): number {
  if (spendMyr <= 0) return 0;
  return Math.floor(spendMyr * pointsPerMyr * seasonalMultiplier);
}

export function determineTier(lifetimePoints: number): string {
  if (lifetimePoints >= 5000) return 'Icon';
  if (lifetimePoints >= 3000) return 'Master';
  if (lifetimePoints >= 1000) return 'Legend';
  if (lifetimePoints >= 500) return 'Regular';
  return 'Rookie';
}

export function calculateProgressToNextTier(lifetimePoints: number): { nextTier: string | null, pointsNeeded: number, progressPercentage: number } {
  const tiers = [
    { name: 'Rookie', threshold: 0 },
    { name: 'Regular', threshold: 500 },
    { name: 'Legend', threshold: 1000 },
    { name: 'Master', threshold: 3000 },
    { name: 'Icon', threshold: 5000 },
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
