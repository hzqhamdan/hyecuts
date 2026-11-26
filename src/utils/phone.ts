/**
 * Formats what was typed into the profile's phone field, which shows a fixed
 * "+60" in front of it, as a Malaysian number in +60 form: "+60 12-345 6789".
 *
 * A number in +60 form drops its leading 0 (012 becomes +60 12), so a 0 typed
 * first is dropped. Mobile numbers have 9 digits after +60, or 10 for 011 and
 * 015 numbers ("+60 11-1234 5678"). A pasted "+60 ..." number keeps its
 * digits too. No digits at all gives '', not a bare "+60".
 */
export function formatMalaysianPhone(typed: string): string {
  let digits = typed.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('60')) digits = digits.slice(2);
  digits = digits.replace(/^0+/, '').slice(0, 10);

  if (digits === '') return '';
  if (digits.length <= 2) return `+60 ${digits}`;
  if (digits.length <= 5) return `+60 ${digits.slice(0, 2)}-${digits.slice(2)}`;
  if (digits.length <= 9) return `+60 ${digits.slice(0, 2)}-${digits.slice(2, 5)} ${digits.slice(5)}`;
  return `+60 ${digits.slice(0, 2)}-${digits.slice(2, 6)} ${digits.slice(6)}`;
}
