import { describe, expect, it } from 'vitest';
import { formatMalaysianPhone } from './phone';

describe('formatMalaysianPhone', () => {
  it('formats a 9-digit mobile number', () => {
    expect(formatMalaysianPhone('123456789')).toBe('+60 12-345 6789');
  });

  it('drops the leading 0 of a local number instead of the last digit', () => {
    expect(formatMalaysianPhone('0198765432')).toBe('+60 19-876 5432');
    expect(formatMalaysianPhone('019-876 5432')).toBe('+60 19-876 5432');
  });

  it('keeps all ten digits of an 011 number', () => {
    expect(formatMalaysianPhone('01112345678')).toBe('+60 11-1234 5678');
  });

  it('keeps the digits of a pasted +60 number', () => {
    expect(formatMalaysianPhone('+60 12-345 6789')).toBe('+60 12-345 6789');
    expect(formatMalaysianPhone('+601112345678')).toBe('+60 11-1234 5678');
  });

  it('formats a number as it is typed', () => {
    expect(formatMalaysianPhone('1')).toBe('+60 1');
    expect(formatMalaysianPhone('123')).toBe('+60 12-3');
    expect(formatMalaysianPhone('123456')).toBe('+60 12-345 6');
  });

  it('stops at ten digits', () => {
    expect(formatMalaysianPhone('11123456789')).toBe('+60 11-1234 5678');
  });

  it('gives an empty string when there are no digits', () => {
    expect(formatMalaysianPhone('')).toBe('');
    expect(formatMalaysianPhone('0')).toBe('');
    expect(formatMalaysianPhone('-')).toBe('');
  });
});
