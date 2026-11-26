/// <reference types="node" />
// Vitest returns an empty module for CSS imports, so the files are read from disk.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildTokensCss, type TokensFile } from './buildTokensCss';
import { tokenHex } from './tokens';

// Git may check the files out with CRLF line endings on Windows.
const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const tokens = JSON.parse(read('./tokens.json')) as TokensFile;
const themeValue = (name: string, theme: 'light' | 'dark') =>
  tokens.color.tokens.find((t) => t.name === name)?.value[theme].toLowerCase();
const lightValue = (name: string) => themeValue(name, 'light');

describe('design tokens', () => {
  it('tokens.css is generated from tokens.json (run `npm run tokens` if this fails)', () => {
    expect(read('./tokens.css')).toBe(buildTokensCss(tokens));
  });

  // WebGL and Stripe read these hex strings directly, so they cannot follow the CSS.
  it('tokenHex matches tokens.json', () => {
    expect(tokenHex.studioBlack.toLowerCase()).toBe(lightValue('studio-black'));
    expect(tokenHex.studioWhite.toLowerCase()).toBe(lightValue('studio-white'));
    expect(tokenHex.studioGold.toLowerCase()).toBe(lightValue('studio-gold'));
    expect(tokenHex.statusDangerStudio.toLowerCase()).toBe(themeValue('status-danger', 'dark'));
  });
});
