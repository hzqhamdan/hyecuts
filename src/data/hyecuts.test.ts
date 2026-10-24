import { describe, it, expect } from 'vitest';
import { AVAILABLE_TIMES, timesForDay } from './hyecuts';

describe('timesForDay', () => {
  it('offers every slot on a day that opens at noon', () => {
    expect(timesForDay('Monday')).toEqual(AVAILABLE_TIMES);
  });

  it('drops the slots before Friday\'s 2:30 PM opening', () => {
    const friday = timesForDay('Friday');

    expect(friday[0]).toBe('02:30 PM');
    expect(friday).not.toContain('12:00 PM');
    expect(friday).not.toContain('02:00 PM');
    expect(friday).toContain('09:30 PM');
  });

  it('keeps the last slot that starts before closing', () => {
    expect(timesForDay('Saturday').at(-1)).toBe('09:30 PM');
  });

  it('has no slots for an unknown day', () => {
    expect(timesForDay('Funday')).toEqual([]);
  });
});
