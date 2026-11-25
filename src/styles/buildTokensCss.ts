// Turns the design system's tokens.json into src/styles/tokens.css.
// Run `npm run tokens` after changing tokens.json; tokens.test.ts fails if the two drift.

interface ThemedColor {
  name: string;
  value: Record<string, string>;
}

interface PlainToken {
  name: string;
  value: string;
}

export interface TokensFile {
  name: string;
  color: { themes: { id: string }[]; tokens: ThemedColor[] };
  type: { families: Record<string, string> };
  spacing: { tokens: PlainToken[] };
  radius: { tokens: PlainToken[] };
  shadow: { tokens: PlainToken[] };
}

const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i;

function parseHex(hex: string): { rgb: string; alpha?: string } {
  const m = HEX.exec(hex);
  if (!m) throw new Error(`tokens.json: ${hex} is not a #rrggbb or #rrggbbaa colour`);
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  const rgb = `${String(r)} ${String(g)} ${String(b)}`;
  // Two decimals, so #0000001a is written 0.1, the value the app's utilities use.
  return m[4] ? { rgb, alpha: String(Number((parseInt(m[4], 16) / 255).toFixed(2))) } : { rgb };
}

// A colour inside a composite value such as a box-shadow.
function hexToRgbFunction(value: string): string {
  return value.replace(/#[0-9a-f]{6}(?:[0-9a-f]{2})?\b/gi, (hex) => {
    const { rgb, alpha } = parseHex(hex);
    return alpha === undefined ? `rgb(${rgb})` : `rgb(${rgb} / ${alpha})`;
  });
}

// An opaque colour becomes an RGB triple, which tailwind.config.js reads so alpha
// modifiers work, plus a ready colour for plain CSS. A translucent one is written whole.
function colorLines(token: ThemedColor, theme: string): string[] {
  const { rgb, alpha } = parseHex(token.value[theme]);
  return alpha === undefined
    ? [`  --${token.name}-rgb: ${rgb};`]
    : [`  --${token.name}: rgb(${rgb} / ${alpha});`];
}

export function buildTokensCss(tokens: TokensFile): string {
  const [light, dark] = tokens.color.themes.map((t) => t.id);
  const colors = tokens.color.tokens;
  const opaque = colors.filter((t) => parseHex(t.value[light]).alpha === undefined);
  const darkChanges = colors.filter((t) => t.value[dark] !== t.value[light]);

  const lines = [
    `/* ${tokens.name} — generated from tokens.json */`,
    '/* Do not edit by hand: change src/styles/tokens.json, then run `npm run tokens`. */',
    '',
    ':root {',
    '  color-scheme: light;',
    '',
    ...colors.flatMap((t) => colorLines(t, light)),
    '',
    ...opaque.map((t) => `  --${t.name}: rgb(var(--${t.name}-rgb));`),
    '',
    ...Object.entries(tokens.type.families).map(([key, stack]) => `  --font-${key}: ${stack};`),
    '',
    ...tokens.spacing.tokens.map((t) => `  --${t.name}: ${t.value};`),
    '',
    ...tokens.radius.tokens.map((t) => `  --${t.name}: ${t.value};`),
    '',
    ...tokens.shadow.tokens.map((t) => `  --${t.name}: ${hexToRgbFunction(t.value)};`),
    '}',
    '',
    // The app switches themes with a class on <html> (App.tsx), not a data-theme attribute.
    'html.dark {',
    '  color-scheme: dark;',
    '',
    ...darkChanges.flatMap((t) => colorLines(t, dark)),
    '}',
    '',
  ];
  return lines.join('\n');
}
