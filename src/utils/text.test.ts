import { describe, expect, it } from 'vitest';
import { firstNonEmpty } from './text';

describe('firstNonEmpty', () => {
  it('skips null, undefined and empty strings, as `||` did', () => {
    expect(firstNonEmpty(null, undefined, '', 'b', 'c')).toBe('b');
  });

  it('keeps whitespace, which `||` also kept', () => {
    expect(firstNonEmpty(' ', 'b')).toBe(' ');
  });

  it('is undefined when nothing is filled in', () => {
    expect(firstNonEmpty(null, '')).toBeUndefined();
    expect(firstNonEmpty()).toBeUndefined();
  });
});
