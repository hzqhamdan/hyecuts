import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { api } from '../../api/client';
import { useBookingStore } from '../../store/useBookingStore';
import { PaymentStep } from './PaymentStep';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ token: 'jwt-token', user: { id: 'u-1' } }),
}));

vi.mock('../../api/client', () => ({
  api: { post: vi.fn() },
}));

// No Stripe.js in tests: stub the loader and render Elements as a plain wrapper.
vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn(() => Promise.resolve(null)) }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: () => <div />,
  useStripe: () => null,
  useElements: () => null,
}));

const mockedPost = vi.mocked(api.post);

describe('PaymentStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    useBookingStore.getState().reset();
  });

  it('requests the deposit for the resolved service and shows the amount the server charged', async () => {
    mockedPost.mockResolvedValue({ clientSecret: 'pi_secret', depositAmount: '12.78' });

    render(<PaymentStep serviceId={4} onPaymentSuccess={vi.fn()} />);

    expect(await screen.findByText('Deposit: RM 12.78')).toBeInTheDocument();
    expect(mockedPost).toHaveBeenCalledWith('/payments/create-intent', {
      body: { serviceId: 4 },
      token: 'jwt-token',
    });
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('never falls back to another service when the id could not be resolved (PAY-004)', () => {
    render(<PaymentStep serviceId={undefined} onPaymentSuccess={vi.fn()} />);

    expect(mockedPost).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('could not set up the deposit');
  });

  it('shows an error instead of spinning forever when the intent cannot be created', async () => {
    mockedPost.mockRejectedValue(new Error('502'));

    render(<PaymentStep serviceId={4} onPaymentSuccess={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('could not set up the deposit');
  });

  it('reuses an intent already created for this booking instead of requesting another', () => {
    useBookingStore.setState({ clientSecret: 'pi_existing', depositAmount: '7.50' });

    render(<PaymentStep serviceId={5} onPaymentSuccess={vi.fn()} />);

    expect(mockedPost).not.toHaveBeenCalled();
    expect(screen.getByText('Deposit: RM 7.50')).toBeInTheDocument();
  });
});
