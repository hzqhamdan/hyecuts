/**
 * The first argument that is a non-empty string, or undefined.
 *
 * For fallbacks written with `||`, where an empty string should fall through to the
 * next value. `??` only skips null and undefined, so it would keep the empty string.
 */
export function firstNonEmpty(...values: (string | null | undefined)[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value !== '');
}
