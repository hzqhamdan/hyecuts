import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
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
const mockedPost = vi.mocked(api.post);

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

  it('lists daily, weekly and quest missions', async () => {
    const base = { description: '', rewardPoints: 10, targetAction: 'BOOK', requiredCount: 1 };
    mockedGet.mockImplementation((path: string) => {
      const type = /^\/gamification\/missions\/type\/(\w+)$/.exec(path)?.[1];
      if (type) return Promise.resolve([{ ...base, id: type.length, title: type, type }]);
      if (path.startsWith('/loyalty/profile/')) {
        return Promise.resolve({ id: 'u-1', email: 'member@example.com', currentPoints: 0, tier: 'MEMBER' });
      }
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useLoungeData('u-1', 'token'));

    await waitFor(() => { expect(result.current.isLoading).toBe(false); });

    expect(result.current.missions.map((m) => m.type)).toEqual(['DAILY', 'WEEKLY', 'QUEST']);
  });

  it('fetches the profile once, not again on every render', async () => {
    const { result, rerender } = renderHook(() => useLoungeData('u-1', 'token'));
    await waitFor(() => { expect(result.current.isLoading).toBe(false); });
    rerender();
    rerender();

    const profileCalls = mockedGet.mock.calls.filter(([path]) => path.startsWith('/loyalty/profile/'));
    expect(profileCalls).toHaveLength(1);
  });

  it('maps the profile it reloads after a redemption, like the first load', async () => {
    const { result } = renderHook(() => useLoungeData('u-1', 'token'));
    await waitFor(() => { expect(result.current.isLoading).toBe(false); });

    mockedPost.mockResolvedValue(undefined);
    mockedGet.mockImplementation((path: string) =>
      path.startsWith('/loyalty/profile/')
        ? Promise.resolve({ id: 'u-1', email: 'member@example.com', currentPoints: 150, tier: 'INSIDER' })
        : Promise.resolve([]),
    );
    await act(() => result.current.handleRedeem('on'));

    expect(result.current.redemptionStatus).toBe('success');
    expect(result.current.profile).toMatchObject({ userId: 'u-1', pointsBalance: 150, currentTier: 'INSIDER', username: 'member@example.com' });
  });
});
