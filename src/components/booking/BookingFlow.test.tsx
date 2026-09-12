import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { useBookingStore } from '../../store/useBookingStore';
import { api } from '../../api/client';

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

// Mirrors what GET /services/active really returns. This used to be `[]`,
// which meant no service ever matched and every booking in this suite went
// through the `serviceId = 1` fallback (BK-019). The suite passed *because of*
// the bug — and only because 'Adult Hair Cut' happens to be id 1, so the wrong
// answer looked like the right one.
vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue([
      { id: 1, name: 'Adult Hair Cut', price: 'RM 25', duration: '30 mins' },
      { id: 4, name: 'Teenager Hair Cut', price: 'RM 20', duration: '30 mins' },
      { id: 2, name: 'Adult Cut & Shave', price: 'RM 30', duration: '30 mins' },
      { id: 8, name: 'Beard Trim/Shape', price: 'RM 10', duration: '10 mins' },
    ]),
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
    useBookingStore.getState().setStep(3);
    renderBookingFlow();

    useBookingStore.getState().setStep(3);

    screen.getByText('booking.step_label');
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

    // Guest bookings require contact details (BK-002) before "Pay at Shop"
    // enables — fill them in via their placeholder text (also defaultValue-
    // rendered, same as the buttons below).
    await user.type(screen.getByPlaceholderText('Full Name'), 'Jane Guest');
    await user.type(screen.getByPlaceholderText('Email'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('Phone Number'), '+60123456789');

    // Unlike the other buttons in this flow, "Pay at Shop" is rendered via
    // t('booking.pay_at_shop', { defaultValue: 'Pay at Shop' }) — the mocked
    // t() above returns the defaultValue when one is supplied, so the DOM text
    // is the English label, not the raw key.
    const payAtShopBtn = screen.getByText('Pay at Shop', { exact: false });
    expect(payAtShopBtn.closest('button')).not.toBeDisabled();
    await user.click(payAtShopBtn);

    expect(screen.getByText('booking.secured')).toBeDefined();
  });

  it('should keep "Pay at Shop" disabled for a guest until contact details are valid', async () => {
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

    const payAtShopBtn = screen.getByText('Pay at Shop', { exact: false });
    expect(payAtShopBtn.closest('button')).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Full Name'), 'Jane Guest');
    await user.type(screen.getByPlaceholderText('Phone Number'), '+60123456789');
    // Email left blank/invalid — still disabled.
    expect(payAtShopBtn.closest('button')).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Email'), 'jane@example.com');
    expect(payAtShopBtn.closest('button')).not.toBeDisabled();
  });

  it('should not show "Proceed to Payment" for a guest (auth required for online deposits)', async () => {
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

    expect(screen.queryByText('Proceed to Payment', { exact: false })).toBeNull();
  });

  it('should not show the success step when the booking API call fails (BK-003)', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Slot no longer available'));
    renderBookingFlow();

    await user.click(screen.getByText('booking.guest_cta'));
    await user.click(screen.getByText('data.services.Adult Hair Cut'));
    await user.click(screen.getByText('booking.continue_barber'));
    await user.click(screen.getByText('landing.no_preference'));
    await user.click(screen.getByText('booking.continue_schedule'));
    await user.click(screen.getByText('data.days.Monday'));
    await user.click(screen.getByText('12:00 PM'));
    await user.click(screen.getByText('booking.review_booking'));

    await user.type(screen.getByPlaceholderText('Full Name'), 'Jane Guest');
    await user.type(screen.getByPlaceholderText('Email'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('Phone Number'), '+60123456789');

    await user.click(screen.getByText('Pay at Shop', { exact: false }));

    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Slot no longer available'));
    expect(screen.queryByText('booking.secured')).toBeNull();
    // Still on the review step — nothing was faked.
    expect(screen.getByText('booking.final_review')).toBeDefined();
  });

  // =============== BK-019/020: no silent serviceId = 1 fallback ===============

  /** Drives the flow from the service step through to a completed booking. */
  async function bookService(user: ReturnType<typeof userEvent.setup>, serviceName: string) {
    await user.click(screen.getByText('booking.guest_cta'));
    await user.click(screen.getByText(`data.services.${serviceName}`));
    await user.click(screen.getByText('booking.continue_barber'));
    await user.click(screen.getByText('landing.no_preference'));
    await user.click(screen.getByText('booking.continue_schedule'));
    await user.click(screen.getByText('data.days.Monday'));
    await user.click(screen.getByText('12:00 PM'));
    await user.click(screen.getByText('booking.review_booking'));
    await user.type(screen.getByPlaceholderText('Full Name'), 'Jane Guest');
    await user.type(screen.getByPlaceholderText('Email'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('Phone Number'), '+60123456789');
    await user.click(screen.getByText('Pay at Shop', { exact: false }));
  }

  it('books the id the customer actually chose, not the fallback (BK-019)', async () => {
    // 'Teenager Hair Cut' is id 4. The old fallback was a hardcoded 1, which is
    // 'Adult Hair Cut' — a different service at a different price. Asserting on a
    // service whose id is NOT 1 is the whole point: with id 1 the bug is invisible.
    const user = userEvent.setup();
    renderBookingFlow();

    await bookService(user, 'Teenager Hair Cut');

    const [path, options] = vi.mocked(api.post).mock.calls[0];
    expect(path).toBe('/bookings');
    expect((options as { body: { serviceId: number } }).body.serviceId).toBe(4);
  });

  it('cannot select a service the database does not have (BK-019)', async () => {
    // The picker is driven by hardcoded data; the id comes from the DB. When an
    // admin deactivates or renames a service the two disagree, and the customer
    // used to be booked into whatever service happens to be id 1.
    const user = userEvent.setup();
    vi.mocked(api.get).mockResolvedValueOnce([
      { id: 4, name: 'Teenager Hair Cut', price: 'RM 20', duration: '30 mins' },
      { id: 2, name: 'Adult Cut & Shave', price: 'RM 30', duration: '30 mins' },
    ]);
    renderBookingFlow();

    await user.click(screen.getByText('booking.guest_cta'));
    await screen.findByText('data.services.Adult Hair Cut');
    await user.click(screen.getByText('data.services.Adult Hair Cut'));

    // Not selectable, so the flow cannot advance past the service step.
    expect(screen.getByText('booking.continue_barber').closest('button')?.disabled).toBe(true);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('does not book anything when the service list cannot be loaded (BK-020)', async () => {
    // Previously the fetch error was swallowed with console.error and the booking
    // proceeded on the fallback id. If we cannot resolve the service we must not guess.
    const user = userEvent.setup();
    vi.mocked(api.get).mockRejectedValueOnce(new Error('network down'));
    renderBookingFlow();

    await user.click(screen.getByText('booking.guest_cta'));

    // Surfaced at the service step, not after five steps of data entry.
    expect(await screen.findByText(/Could not load available services/i)).toBeDefined();

    // With no list, no id is resolvable, so nothing is selectable and the flow
    // cannot advance. The customer never reaches Confirm to lose work there.
    await user.click(screen.getByText('data.services.Adult Hair Cut'));
    expect(screen.getByText('booking.continue_barber').closest('button')?.disabled).toBe(true);
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.queryByText('booking.secured')).toBeNull();
  });

  it('never falls back to serviceId 1 for an unresolvable selection (BK-019)', async () => {
    // Backstop for a selection that goes stale mid-flow — an admin deactivates the
    // service while the customer is on the date step. Set directly on the store
    // because the picker itself now prevents reaching this state.
    const user = userEvent.setup();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    vi.mocked(api.get).mockResolvedValueOnce([
      { id: 4, name: 'Teenager Hair Cut', price: 'RM 20', duration: '30 mins' },
      { id: 2, name: 'Adult Cut & Shave', price: 'RM 30', duration: '30 mins' },
    ]);
    renderBookingFlow();

    await user.click(screen.getByText('booking.guest_cta'));
    await screen.findByText('data.services.Adult Hair Cut');
    useBookingStore.setState({ selectedService: 'Some Retired Service' });

    await user.click(screen.getByText('booking.continue_barber'));
    await user.click(screen.getByText('landing.no_preference'));
    await user.click(screen.getByText('booking.continue_schedule'));
    await user.click(screen.getByText('data.days.Monday'));
    await user.click(screen.getByText('12:00 PM'));
    await user.click(screen.getByText('booking.review_booking'));
    await user.type(screen.getByPlaceholderText('Full Name'), 'Jane Guest');
    await user.type(screen.getByPlaceholderText('Email'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('Phone Number'), '+60123456789');
    await user.click(screen.getByText('Pay at Shop', { exact: false }));

    expect(api.post).not.toHaveBeenCalled();
  });
});
