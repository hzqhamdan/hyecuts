/* Hyecuts Studio — the few tokens that JavaScript has to name.
 *
 * Generated alongside src/styles/tokens.css from the design system's tokens.json
 * (https://claude.ai/artifact/FEKGTS8B1ghdDtqFcthnNA). Anything that can be a Tailwind
 * class should be one — `text-gold`, `bg-surface-card`, `border-hairline`. This file is
 * only for the two places a class cannot reach.
 */

/** For props that end up in CSS: SVG attributes, Recharts, inline styles. */
export const tokenColor = {
  gold: 'var(--studio-gold)',
  ink: 'var(--ink)',
  inkMuted: 'var(--ink-muted)',
  slate: 'var(--studio-slate)',
  surfaceCard: 'var(--surface-card)',
  hairlineStrong: 'var(--hairline-strong)',
} as const;

/** The five Recharts series, in order. */
export const CHART_SERIES = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

/**
 * Raw hex, for consumers that parse colours themselves and cannot resolve a CSS variable
 * — currently only the WebGL shader behind the sign-in screen, which converts hex to a
 * uniform. Keep this in step with tokens.css.
 */
export const tokenHex = {
  studioGold: '#B8A070',
} as const;
