/**
 * Formats a Date as `YYYY-MM-DDTHH:mm:ss` in the **browser's local time**,
 * with no timezone suffix.
 *
 * The backend stores appointments as a timezone-naive `LocalDateTime` against a
 * `TIMESTAMP WITHOUT TIME ZONE` column, so whatever wall-clock time we send is
 * taken at face value. `Date.prototype.toISOString()` is therefore the wrong
 * tool: it converts to UTC, so a user in Malaysia (UTC+8) picking 10:00 would
 * send `02:00Z` and be booked at 02:00.
 *
 * That is exactly how BK-016 happened — the create and reschedule paths each
 * formatted their own timestamp, and only one of them did it correctly. Both
 * now go through here; keep it that way.
 */
export function toLocalIsoString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear().toString().padStart(4, '0');
  return (
    `${year}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

/**
 * The next date after `from` that falls on `weekday` (e.g. "Friday"), at local
 * midnight. Today never counts: picking today's weekday gives next week.
 * Returns null for an unrecognised weekday name.
 */
export function nextDateForWeekday(weekday: string, from: Date = new Date()): Date | null {
  const target = WEEKDAY_INDEX[weekday] as number | undefined;
  if (target === undefined) return null;
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  date.setDate(date.getDate() + ((target + 7 - date.getDay()) % 7 || 7));
  return date;
}

/**
 * When a new booking for `weekday` at `hours`:`minutes` (24-hour, local time) takes
 * place: the next time that weekday and time come round after `from`. Today counts
 * while the time is still ahead; once it has passed, the booking is for next week.
 * (E2E-004: a time already past today used to be booked for today, in the past.)
 * Returns null for an unrecognised weekday name.
 */
export function nextSlotForWeekday(weekday: string, hours: number, minutes: number, from: Date = new Date()): Date | null {
  const target = WEEKDAY_INDEX[weekday] as number | undefined;
  if (target === undefined) return null;
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate(), hours, minutes);
  date.setDate(date.getDate() + ((target + 7 - date.getDay()) % 7));
  if (date <= from) date.setDate(date.getDate() + 7);
  return date;
}
