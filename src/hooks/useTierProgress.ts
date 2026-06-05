export function getTierProgress(points: number, tier: string) {
  let min = 0, max = 1000;
  let nextTier: string | null = 'Regular';

  if (tier === 'Icon') {
    return { percentage: 100, nextTier: null };
  }

  if (tier === 'Master') { min = 5000; max = 10000; nextTier = 'Icon'; }
  else if (tier === 'Legend') { min = 2500; max = 5000; nextTier = 'Master'; }
  else if (tier === 'Regular') { min = 1000; max = 2500; nextTier = 'Legend'; }
  else { min = 0; max = 1000; nextTier = 'Regular'; }

  const percentage = Math.min(100, Math.max(0, ((points - min) / (max - min)) * 100));
  return { percentage, nextTier };
}
