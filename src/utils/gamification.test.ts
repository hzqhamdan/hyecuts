import { describe, it, expect } from 'vitest';
import { calculateLoyaltyPoints, determineTier, calculateProgressToNextTier } from './gamification';

describe('Gamification Logic', () => {
  describe('calculateLoyaltyPoints', () => {
    it('should calculate base points correctly', () => {
      expect(calculateLoyaltyPoints(50, 10)).toBe(500);
    });

    it('should apply seasonal multiplier', () => {
      expect(calculateLoyaltyPoints(50, 10, 1.5)).toBe(750);
    });

    it('should return 0 for negative spend', () => {
      expect(calculateLoyaltyPoints(-10, 10)).toBe(0);
    });

    it('should floor decimal points', () => {
      expect(calculateLoyaltyPoints(25.5, 10, 1.25)).toBe(318);
    });
  });

  describe('determineTier', () => {
    it('should identify Rookie tier', () => {
      expect(determineTier(0)).toBe('Rookie');
      expect(determineTier(499)).toBe('Rookie');
    });

    it('should identify Regular tier', () => {
      expect(determineTier(500)).toBe('Regular');
      expect(determineTier(999)).toBe('Regular');
    });

    it('should identify Legend tier', () => {
      expect(determineTier(1000)).toBe('Legend');
      expect(determineTier(2999)).toBe('Legend');
    });

    it('should identify Master tier', () => {
      expect(determineTier(3000)).toBe('Master');
      expect(determineTier(4999)).toBe('Master');
    });

    it('should identify Icon tier', () => {
      expect(determineTier(5000)).toBe('Icon');
      expect(determineTier(10000)).toBe('Icon');
    });
  });

  describe('calculateProgressToNextTier', () => {
    it('should calculate progress from Rookie to Regular', () => {
      const result = calculateProgressToNextTier(250);
      expect(result.nextTier).toBe('Regular');
      expect(result.pointsNeeded).toBe(250);
      expect(result.progressPercentage).toBe(50);
    });

    it('should calculate progress from Legend to Master', () => {
      const result = calculateProgressToNextTier(2000);
      expect(result.nextTier).toBe('Master');
      expect(result.pointsNeeded).toBe(1000);
      // 1000 points into the 2000 point range (1000 to 3000)
      expect(result.progressPercentage).toBe(50);
    });

    it('should handle max tier (Icon)', () => {
      const result = calculateProgressToNextTier(6000);
      expect(result.nextTier).toBe(null);
      expect(result.pointsNeeded).toBe(0);
      expect(result.progressPercentage).toBe(100);
    });
  });
});
