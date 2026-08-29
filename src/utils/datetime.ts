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
