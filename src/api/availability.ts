import { api, ApiError } from './client';
import { minuteKey } from '../utils/datetime';

interface DayBooking {
  appointmentTime: string;
  status: string;
}

/**
 * The appointment times already taken on `date` (YYYY-MM-DD), as minute keys
 * (`YYYY-MM-DDTHH:mm`; see minuteKey). Every booking but a cancelled one holds
 * its slot, the same rule as the database index that refuses a double booking.
 *
 * Reads GET /bookings/availability/{date}. A backend from before that endpoint
 * answers 401 (to guests), 403 or 404; a signed-in caller then falls back to
 * GET /bookings/date/{date}, which that backend still let members read. Drop the
 * fallback once the new backend is deployed.
 */
export async function fetchTakenTimes(date: string, token?: string): Promise<Set<string>> {
  try {
    const times = await api.get<string[]>(`/bookings/availability/${date}`, { token });
    return new Set(times.map((time) => minuteKey(time)));
  } catch (error) {
    const olderBackend = error instanceof ApiError && [401, 403, 404].includes(error.status);
    if (!olderBackend || !token) throw error;
    const bookings = await api.get<DayBooking[]>(`/bookings/date/${date}`, { token });
    return new Set(
      bookings.filter((booking) => booking.status !== 'CANCELLED').map((booking) => minuteKey(booking.appointmentTime)),
    );
  }
}
