import { describe, it, expect } from 'vitest';
import { nextDateForWeekday, toLocalIsoString } from './datetime';

describe('toLocalIsoString (BK-016)', () => {
  it('returns the local wall-clock time it was given', () => {
    // Constructed from *local* components, so the expected string is the same
    // in every timezone — but toISOString() would return the UTC shift and
    // fail this anywhere the offset is non-zero. Tests are pinned to
    // Asia/Kuala_Lumpur (UTC+8) in vite.config.ts so that is always the case.
    const d = new Date(2026, 8, 15, 10, 0, 0);
    expect(toLocalIsoString(d)).toBe('2026-09-15T10:00:00');
  });

  it('does not shift the hour the way toISOString does', () => {
    const d = new Date(2026, 8, 15, 10, 0, 0);
    // The exact bug: a Malaysian user picking 10:00 was sent as 02:00Z.
    expect(toLocalIsoString(d)).not.toBe(d.toISOString().slice(0, 19));
    expect(toLocalIsoString(d).slice(11, 13)).toBe('10');
  });

  it('carries no timezone suffix', () => {
    // The backend parses this straight into a timezone-naive LocalDateTime;
    // a trailing Z would be stripped and silently reinterpreted as local.
    const out = toLocalIsoString(new Date(2026, 0, 1, 9, 30, 0));
    expect(out.endsWith('Z')).toBe(false);
    expect(out).toBe('2026-01-01T09:30:00');
  });

  it('zero-pads every component', () => {
    expect(toLocalIsoString(new Date(2026, 0, 5, 7, 8, 9))).toBe('2026-01-05T07:08:09');
  });

  it('keeps the local date when local and UTC fall on different days', () => {
    // 00:30 local on 3 Mar is 16:30 on 2 Mar UTC — the create path must not
    // book the previous day.
    const d = new Date(2026, 2, 3, 0, 30, 0);
    expect(toLocalIsoString(d)).toBe('2026-03-03T00:30:00');
    expect(d.toISOString().slice(8, 10)).toBe('02');
  });
});

describe('nextDateForWeekday', () => {
  // Wednesday 21 October 2026, mid-afternoon local time.
  const wednesday = new Date(2026, 9, 21, 15, 45);
  const ymd = (d: Date | null) => (d ? toLocalIsoString(d) : null);

  it('returns the coming occurrence of a later weekday this week', () => {
    expect(ymd(nextDateForWeekday('Friday', wednesday))).toBe('2026-10-23T00:00:00');
  });

  it('never returns today: today\'s weekday means next week', () => {
    expect(ymd(nextDateForWeekday('Wednesday', wednesday))).toBe('2026-10-28T00:00:00');
  });

  it('wraps an earlier weekday into next week', () => {
    expect(ymd(nextDateForWeekday('Monday', wednesday))).toBe('2026-10-26T00:00:00');
  });

  it('crosses a month and year boundary', () => {
    expect(ymd(nextDateForWeekday('Friday', new Date(2026, 11, 31, 9, 0)))).toBe('2027-01-01T00:00:00');
  });

  it('returns null for an unknown weekday name', () => {
    expect(nextDateForWeekday('Funday', wednesday)).toBeNull();
  });

  it('does not modify the date it was given', () => {
    const from = new Date(wednesday);
    nextDateForWeekday('Friday', from);
    expect(from.getTime()).toBe(wednesday.getTime());
  });
});
