import type { ComponentProps } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../api/client';
import RescheduleModal from './RescheduleModal';

vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);
const mockedPut = vi.mocked(api.put);

function renderModal(overrides: Partial<ComponentProps<typeof RescheduleModal>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    bookingId: 'booking-123',
    token: 'jwt-token',
    ...overrides,
  };
  render(<RescheduleModal {...props} />);
  return props;
}

const confirmButton = () => screen.getByRole('button', { name: /confirm reschedule|processing/i });

describe('RescheduleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGet.mockResolvedValue([]);
    // Only Date is faked so user-event and framer-motion keep real timers.
    // Wednesday 21 October 2026, 10:00 local time.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21, 10, 0, 0));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when closed', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByText('Reschedule Appointment')).not.toBeInTheDocument();
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('keeps confirm disabled until both a date and a time are picked', async () => {
    const user = userEvent.setup();
    renderModal();

    expect(confirmButton()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Friday' }));
    expect(confirmButton()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /^02:30 PM/ }));
    expect(confirmButton()).toBeEnabled();
  });

  it('looks up booked slots by the calendar date of the chosen day (BK-051)', async () => {
    // It used to request /bookings/date/Friday, which the backend rejects.
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Friday' }));

    expect(mockedGet).toHaveBeenCalledWith('/bookings/date/2026-10-23', { token: 'jwt-token' });
  });

  it('disables slots held by pending or confirmed bookings, and only those', async () => {
    const user = userEvent.setup();
    mockedGet.mockResolvedValue([
      { id: 'a', appointmentTime: '2026-10-23T14:30:00', status: 'PENDING' },
      { id: 'b', appointmentTime: '2026-10-23T15:00:00', status: 'CONFIRMED' },
      { id: 'c', appointmentTime: '2026-10-23T16:00:00', status: 'CANCELLED' },
      { id: 'd', appointmentTime: '2026-10-23T17:00:00', status: 'COMPLETED' },
    ]);
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Friday' }));

    expect(await screen.findByRole('button', { name: '02:30 PM (Booked)' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '03:00 PM (Booked)' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^04:00 PM/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^05:00 PM/ })).toBeEnabled();
  });

  it('clears a chosen time that turns out to be booked on the newly picked day', async () => {
    const user = userEvent.setup();
    mockedGet.mockImplementation((path: string) => Promise.resolve(
      path === '/bookings/date/2026-10-26'
        ? [{ id: 'a', appointmentTime: '2026-10-26T14:30:00', status: 'CONFIRMED' }]
        : []
    ));
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Friday' }));
    await user.click(screen.getByRole('button', { name: /^02:30 PM/ }));
    expect(confirmButton()).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Monday' }));

    expect(await screen.findByRole('button', { name: '02:30 PM (Booked)' })).toBeDisabled();
    expect(confirmButton()).toBeDisabled();
  });

  it('does not look up booked slots before a date is picked', () => {
    renderModal();

    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('reschedules to the next occurrence of the chosen day at the chosen local time', async () => {
    const user = userEvent.setup();
    mockedPut.mockResolvedValue(undefined);
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: 'Friday' }));
    await user.click(screen.getByRole('button', { name: /^02:30 PM/ }));
    await user.click(confirmButton());

    expect(mockedPut).toHaveBeenCalledTimes(1);
    expect(mockedPut).toHaveBeenCalledWith('/bookings/booking-123/reschedule', {
      // Local wall-clock with no zone suffix (BK-016), not toISOString().
      body: { newAppointmentTime: '2026-10-23T14:30:00' },
      token: 'jwt-token',
    });
    expect(props.onSuccess).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('picking today\'s weekday moves the booking a week out, never to today', async () => {
    const user = userEvent.setup();
    mockedPut.mockResolvedValue(undefined);
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Wednesday' }));
    await user.click(screen.getByRole('button', { name: /^12:00 PM/ }));
    await user.click(confirmButton());

    expect(mockedPut).toHaveBeenCalledWith(
      '/bookings/booking-123/reschedule',
      expect.objectContaining({ body: { newAppointmentTime: '2026-10-28T12:00:00' } })
    );
  });

  it('converts PM slots to 24-hour time', async () => {
    const user = userEvent.setup();
    mockedPut.mockResolvedValue(undefined);
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Monday' }));
    await user.click(screen.getByRole('button', { name: /^08:30 PM/ }));
    await user.click(confirmButton());

    expect(mockedPut).toHaveBeenCalledWith(
      '/bookings/booking-123/reschedule',
      expect.objectContaining({ body: { newAppointmentTime: '2026-10-26T20:30:00' } })
    );
  });

  it('leaves the modal open and does not report success when the reschedule fails', async () => {
    const user = userEvent.setup();
    mockedPut.mockRejectedValue(new Error('Reschedule limit reached'));
    const props = renderModal();

    await user.click(screen.getByRole('button', { name: 'Friday' }));
    await user.click(screen.getByRole('button', { name: /^02:30 PM/ }));
    await user.click(confirmButton());

    expect(props.onSuccess).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
    expect(confirmButton()).toHaveTextContent('Confirm Reschedule');
    expect(confirmButton()).toBeEnabled();
  });

  it('sends no token when none is given', async () => {
    const user = userEvent.setup();
    mockedPut.mockResolvedValue(undefined);
    renderModal({ token: null });

    await user.click(screen.getByRole('button', { name: 'Friday' }));
    await user.click(screen.getByRole('button', { name: /^02:30 PM/ }));
    await user.click(confirmButton());

    expect(mockedPut).toHaveBeenCalledWith(
      '/bookings/booking-123/reschedule',
      expect.objectContaining({ token: undefined })
    );
  });
});
