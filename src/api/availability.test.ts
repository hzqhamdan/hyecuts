import { describe, expect, it, vi, beforeEach } from 'vitest';
import { api, ApiError } from './client';
import { fetchTakenTimes } from './availability';

vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  api: { get: vi.fn() },
}));

const mockedGet = vi.mocked(api.get);

describe('fetchTakenTimes', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('reads the public availability endpoint and keys times to the minute', async () => {
    mockedGet.mockResolvedValue(['2026-11-02T15:00:00', '2026-11-02T16:30']);

    const taken = await fetchTakenTimes('2026-11-02');

    expect(mockedGet).toHaveBeenCalledWith('/bookings/availability/2026-11-02', { token: undefined });
    expect([...taken]).toEqual(['2026-11-02T15:00', '2026-11-02T16:30']);
  });

  it('falls back to the day\'s bookings on a backend without the endpoint, for a signed-in caller', async () => {
    mockedGet.mockImplementation((path: string) => path.startsWith('/bookings/availability/')
      ? Promise.reject(new ApiError(404, 'Not Found'))
      : Promise.resolve([
          { appointmentTime: '2026-11-02T15:00:00', status: 'CONFIRMED' },
          { appointmentTime: '2026-11-02T16:00:00', status: 'CANCELLED' },
          { appointmentTime: '2026-11-02T17:00:00', status: 'COMPLETED' },
        ]));

    const taken = await fetchTakenTimes('2026-11-02', 'jwt');

    expect(mockedGet).toHaveBeenLastCalledWith('/bookings/date/2026-11-02', { token: 'jwt' });
    expect([...taken].sort()).toEqual(['2026-11-02T15:00', '2026-11-02T17:00']);
  });

  it('has no fallback for a guest, who could not read the old endpoint either', async () => {
    mockedGet.mockRejectedValue(new ApiError(401, 'Unauthorized'));

    await expect(fetchTakenTimes('2026-11-02')).rejects.toThrow('Unauthorized');
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it('does not fall back on other failures', async () => {
    mockedGet.mockRejectedValue(new ApiError(500, 'Server error'));

    await expect(fetchTakenTimes('2026-11-02', 'jwt')).rejects.toThrow('Server error');
    expect(mockedGet).toHaveBeenCalledTimes(1);
  });
});
