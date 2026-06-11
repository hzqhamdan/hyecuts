import { describe, it, expect } from 'vitest';
import { calculateLoyaltyPoints, determineTier, calculateProgressToNextTier } from './gamification';

describe('Gamification Logic', () => {
  describe('calculateLoyaltyPoints', () => {
    it('should calculate points as 1:1 MYR', () => {
      expect(calculateLoyaltyPoints(25, 1)).toBe(25);
    });

    it('should apply seasonal multiplier', () => {
      expect(calculateLoyaltyPoints(25, 1, 1.5)).toBe(37);
    });

    it('should return 0 for negative spend', () => {
      expect(calculateLoyaltyPoints(-10, 1)).toBe(0);
    });

    it('should floor decimal points', () => {
      expect(calculateLoyaltyPoints(25.5, 1, 1.25)).toBe(31);
    });
  });

  describe('determineTier', () => {
    it('should identify MEMBER tier', () => {
      expect(determineTier(0)).toBe('MEMBER');
      expect(determineTier(99)).toBe('MEMBER');
    });

    it('should identify INSIDER tier', () => {
      expect(determineTier(100)).toBe('INSIDER');
      expect(determineTier(349)).toBe('INSIDER');
    });

    it('should identify ARTISAN tier', () => {
      expect(determineTier(350)).toBe('ARTISAN');
      expect(determineTier(749)).toBe('ARTISAN');
    });

    it('should identify CONNOISSEUR tier', () => {
      expect(determineTier(750)).toBe('CONNOISSEUR');
      expect(determineTier(1499)).toBe('CONNOISSEUR');
    });

    it('should identify PATRON tier', () => {
      expect(determineTier(1500)).toBe('PATRON');
      expect(determineTier(5000)).toBe('PATRON');
    });
  });

  describe('calculateProgressToNextTier', () => {
    it('should calculate progress from MEMBER to INSIDER', () => {
      const result = calculateProgressToNextTier(50);
      expect(result.nextTier).toBe('INSIDER');
      expect(result.pointsNeeded).toBe(50);
      expect(result.progressPercentage).toBe(50);
    });

    it('should calculate progress from ARTISAN to CONNOISSEUR', () => {
      const result = calculateProgressToNextTier(550);
      expect(result.nextTier).toBe('CONNOISSEUR');
      expect(result.pointsNeeded).toBe(200);
      // 200 points into the 400 point range (350 to 750)
      expect(result.progressPercentage).toBe(50);
    });

    it('should handle max tier (PATRON)', () => {
      const result = calculateProgressToNextTier(2000);
      expect(result.nextTier).toBe(null);
      expect(result.pointsNeeded).toBe(0);
      expect(result.progressPercentage).toBe(100);
    });
  });
});
