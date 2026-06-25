import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { useBookingStore } from '../../store/useBookingStore';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    MemoryRouter: actual.MemoryRouter,
    Routes: actual.Routes,
    Route: actual.Route,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const params = options as Record<string, string> | undefined;
      if (params?.defaultValue) return params.defaultValue;
      return key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({ id: 12345 }),
    put: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../data/hyecuts', async () => {
  const actual = await vi.importActual('../../data/hyecuts');
  return {
    ...actual,
  };
});

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: Record<string, unknown>) => {
        const { initial, animate, exit, ...rest } = props as Record<string, unknown>;
        return <div {...rest}>{children as React.ReactNode}</div>;
      },
    },
  };
});

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
  };
});

vi.mock('./PaymentStep', () => ({
  PaymentStep: ({ onPaymentSuccess }: { onPaymentSuccess: () => void }) => (
    <button data-testid="payment-step" onClick={onPaymentSuccess}>
      Payment Step
    </button>
  ),
}));

vi.mock('../ui/PWAInstallPrompt', () => ({
  default: () => <div data-testid="pwa-prompt">PWA Install</div>,
}));

function renderBookingFlow() {
  return render(
    <BrowserRouter>
      <div data-testid="booking-flow">
        <BookingFlowComponent />
      </div>
    </BrowserRouter>
  );
}

import BookingFlowComponent from './BookingFlow';

describe('BookingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBookingStore.getState().reset();
  });

  it('should render step 0 (login/guest choice) by default', () => {
    renderBookingFlow();
    expect(screen.getByText('booking.how_to_proceed')).toBeDefined();
    expect(screen.getByText('booking.login_cta')).toBeDefined();
    expect(screen.getByText('booking.guest_cta')).toBeDefined();
  });

  it('should show service selection when guest button clicked', async () => {
    const user = userEvent.setup();
    renderBookingFlow();

    await user.click(screen.getByText('booking.guest_cta'));
    expect(screen.getByText('booking.select_service')).toBeDefined();
  });

  it('should show barber selection when continue button clicked after selecting service', async () => {
    const user = userEvent.setup();
    renderBookingFlow();

    await user.click(screen.getByText('booking.guest_cta'));
    expect(screen.getByText('booking.select_service')).toBeDefined();

    const serviceEl = screen.getByText('booking.continue_barber');
    expect(serviceEl.closest('button')).toBeDisabled();

    await user.click(screen.getByText('booking.continue_barber'));
    expect(screen.getByText('booking.select_service')).toBeDefined();

    await user.click(screen.getByText('data.services.Adult Hair Cut'));
    const continueBtn = screen.getByText('booking.continue_barber');
    expect(continueBtn.closest('button')).not.toBeDisabled();

    await user.click(continueBtn);
    expect(screen.getByText('booking.select_barber')).toBeDefined();
  });

  it('should show date/time selection after barber selection', async () => {
    const user = userEvent.setup();
    renderBookingFlow();

    await user.click(screen.getByText('booking.guest_cta'));
    await user.click(screen.getByText('data.services.Adult Hair Cut'));
    await user.click(screen.getByText('booking.continue_barber'));

    const noprefBtn = screen.getByText('landing.no_preference');
    await user.click(noprefBtn);

    const scheduleBtn = screen.getByText('booking.continue_schedule');
    expect(scheduleBtn.closest('button')).not.toBeDisabled();
    await user.click(scheduleBtn);

    expect(screen.getByText('booking.select_schedule')).toBeDefined();
  });

  it('should show review step after date/time selection', async () => {
    const user = userEvent.setup();
    renderBookingFlow();

    await user.click(screen.getByText('booking.guest_cta'));
    await user.click(screen.getByText('data.services.Adult Hair Cut'));
    await user.click(screen.getByText('booking.continue_barber'));
    await user.click(screen.getByText('landing.no_preference'));
    await user.click(screen.getByText('booking.continue_schedule'));

    const dateBtn = screen.getByText('data.days.Monday');
    await user.click(dateBtn);
    const timeBtn = screen.getByText('12:00 PM');
    await user.click(timeBtn);

    const reviewBtn = screen.getByText('booking.review_booking');
    expect(reviewBtn.closest('button')).not.toBeDisabled();
    await user.click(reviewBtn);

    expect(screen.getByText('booking.final_review')).toBeDefined();
  });

  it('should navigate to login page when login button clicked at step 0', async () => {
    const user = userEvent.setup();
    renderBookingFlow();

    await user.click(screen.getByText('booking.login_cta'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should reset store state when back button clicked at step 0', async () => {
    const user = userEvent.setup();
    useBookingStore.getState().setStep(3);
    renderBookingFlow();

    useBookingStore.getState().setStep(3);

    const backBtn = screen.getByText('booking.step_label');
  });

  it('should show confirmation step after booking completed', async () => {
    const user = userEvent.setup();
    renderBookingFlow();

    await user.click(screen.getByText('booking.guest_cta'));
    await user.click(screen.getByText('data.services.Adult Hair Cut'));
    await user.click(screen.getByText('booking.continue_barber'));
    await user.click(screen.getByText('landing.no_preference'));
    await user.click(screen.getByText('booking.continue_schedule'));

    await user.click(screen.getByText('data.days.Monday'));
    await user.click(screen.getByText('12:00 PM'));
    await user.click(screen.getByText('booking.review_booking'));

    const payAtShopBtn = screen.getByText('booking.pay_at_shop', { exact: false });
    await user.click(payAtShopBtn);

    expect(screen.getByText('booking.secured')).toBeDefined();
  });
});
