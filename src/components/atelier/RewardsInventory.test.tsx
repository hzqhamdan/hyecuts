import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api, ApiError } from '../../api/client';
import type { Reward } from '../../types/loyalty';
import { RewardsInventory } from './RewardsInventory';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ token: 'admin-token' }),
}));

vi.mock('../../api/client', async () => {
  const actual = await vi.importActual<typeof import('../../api/client')>('../../api/client');
  return { ...actual, api: { post: vi.fn() } };
});

const mockedPost = vi.mocked(api.post);

const rewards: Reward[] = [
  { id: 'r-1', title: 'Free Wash', description: null, pointsCost: 300, minTier: 'ARTISAN', stockCount: 4, isActive: true },
  { id: 'r-2', title: 'Hot Towel', description: null, pointsCost: 150, minTier: null, stockCount: null, isActive: true },
];

function renderInventory() {
  const onRewardAdded = vi.fn();
  render(<RewardsInventory rewards={rewards} onRewardAdded={onRewardAdded} />);
  return { onRewardAdded };
}

async function openForm() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'atelier.loyalty.add_reward' }));
  return user;
}

describe('RewardsInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('shows each reward\'s stock and tier from the API field names', () => {
    renderInventory();

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('ARTISAN Tier')).toBeInTheDocument();
    // No stock limit and no tier requirement.
    expect(screen.getByText('atelier.loyalty.unlimited')).toBeInTheDocument();
    expect(screen.getByText('lounge.any_tier Tier')).toBeInTheDocument();
  });

  it('sends the tier and stock under the names the backend reads', async () => {
    mockedPost.mockResolvedValue(undefined);
    const { onRewardAdded } = renderInventory();
    const user = await openForm();

    await user.type(screen.getByPlaceholderText('Title'), 'Beard Oil');
    await user.selectOptions(screen.getByRole('combobox'), 'CONNOISSEUR');
    await user.click(screen.getByRole('button', { name: 'atelier.loyalty.save_asset' }));

    expect(mockedPost).toHaveBeenCalledWith('/rewards', {
      body: { title: 'Beard Oil', pointsCost: 1000, minTier: 'CONNOISSEUR', stockCount: 10 },
      token: 'admin-token',
    });
    expect(onRewardAdded).toHaveBeenCalledTimes(1);
  });

  it('sends an empty stock field as null, meaning unlimited', async () => {
    mockedPost.mockResolvedValue(undefined);
    renderInventory();
    const user = await openForm();

    await user.type(screen.getByPlaceholderText('Title'), 'Beard Oil');
    await user.clear(screen.getByPlaceholderText('atelier.loyalty.stock'));
    await user.click(screen.getByRole('button', { name: 'atelier.loyalty.save_asset' }));

    const body = mockedPost.mock.calls[0]?.[1]?.body as { stockCount: number | null };
    expect(body.stockCount).toBeNull();
  });

  it('shows the server\'s validation message instead of failing silently', async () => {
    mockedPost.mockRejectedValue(new ApiError(400, JSON.stringify({
      status: 400, error: 'Bad Request', message: 'Reward title is required.',
    })));
    const { onRewardAdded } = renderInventory();
    const user = await openForm();

    await user.click(screen.getByRole('button', { name: 'atelier.loyalty.save_asset' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Reward title is required.');
    expect(onRewardAdded).not.toHaveBeenCalled();
    // The form stays open so the admin can correct it.
    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
  });

  it('falls back to a generic message for a non-API failure', async () => {
    mockedPost.mockRejectedValue(new TypeError('Failed to fetch'));
    renderInventory();
    const user = await openForm();

    await user.click(screen.getByRole('button', { name: 'atelier.loyalty.save_asset' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save this reward');
  });
});
