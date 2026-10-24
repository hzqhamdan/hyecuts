import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { api } from '../api/client';
import type { Reward } from '../types/loyalty';
import { useLoungeData } from './useLoungeData';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en', changeLanguage: vi.fn() } }),
}));

vi.mock('../api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const mockedGet = vi.mocked(api.get);

function reward(id: string, isActive: boolean): Reward {
  return { id, title: `Reward ${id}`, description: null, pointsCost: 100, minTier: null, stockCount: null, isActive };
}

describe('useLoungeData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGet.mockImplementation((path: string) => {
      if (path === '/rewards') {
        return Promise.resolve([reward('on', true), reward('off', false)]);
      }
      if (path.startsWith('/loyalty/profile/')) {
        return Promise.resolve({ id: 'u-1', email: 'member@example.com', currentPoints: 0, tier: 'MEMBER' });
      }
      return Promise.resolve([]);
    });
  });

  it('lists only rewards that are active', async () => {
    const { result } = renderHook(() => useLoungeData('u-1', 'token'));

    await waitFor(() => { expect(result.current.isLoading).toBe(false); });

    expect(result.current.rewards.map((r) => r.id)).toEqual(['on']);
  });
});
