export function getTierProgress(points: number, tier: string) {
  let min = 0, max = 100;
  let nextTier: string | null = 'INSIDER';

  if (tier === 'PATRON') {
    return { percentage: 100, nextTier: null };
  }

  if (tier === 'CONNOISSEUR') { min = 750; max = 1500; nextTier = 'PATRON'; }
  else if (tier === 'ARTISAN') { min = 350; max = 750; nextTier = 'CONNOISSEUR'; }
  else if (tier === 'INSIDER') { min = 100; max = 350; nextTier = 'ARTISAN'; }
  else { min = 0; max = 100; nextTier = 'INSIDER'; }

  const percentage = Math.min(100, Math.max(0, ((points - min) / (max - min)) * 100));
  return { percentage, nextTier };
}
