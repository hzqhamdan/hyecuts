import { describe, it, expect, afterEach } from 'vitest';
import i18n from './config';
import en from './locales/en.json';
import ms from './locales/ms.json';

interface Tree { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') acc[prefix + key] = value;
    else Object.assign(acc, flatten(value, `${prefix}${key}.`));
    return acc;
  }, {});
}

const enKeys = flatten(en as Tree);
const msKeys = flatten(ms as Tree);

function placeholders(value: string): string[] {
  return (value.match(/{{\s*\w+\s*}}/g) ?? []).map(p => p.replace(/\s/g, '')).sort();
}

describe('i18n config', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('has a Malay translation for every English key', () => {
    const missing = Object.keys(enKeys).filter(key => !(key in msKeys));
    expect(missing).toEqual([]);
  });

  it('has no Malay key that English lacks', () => {
    const orphaned = Object.keys(msKeys).filter(key => !(key in enKeys));
    expect(orphaned).toEqual([]);
  });

  it('has no empty translations', () => {
    const empty = [...Object.entries(enKeys), ...Object.entries(msKeys)]
      .filter(([, value]) => value.trim() === '')
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it('keeps the same interpolation placeholders in both languages', () => {
    // A renamed {{placeholder}} renders literally instead of the value.
    const mismatched = Object.keys(enKeys).filter(
      key => key in msKeys && placeholders(enKeys[key]).join() !== placeholders(msKeys[key]).join()
    );
    expect(mismatched).toEqual([]);
  });

  it('switches the rendered text when the language changes', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('nav.services')).toBe('Services');

    await i18n.changeLanguage('ms');
    expect(i18n.t('nav.services')).toBe('Perkhidmatan');
  });

  it('falls back to English for a language it does not ship', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('nav.services')).toBe('Services');
  });

  it('falls back to English for a regional variant of a shipped language', async () => {
    await i18n.changeLanguage('en-GB');
    expect(i18n.t('nav.services')).toBe('Services');
  });

  it('interpolates values into the active language', async () => {
    await i18n.changeLanguage('ms');
    expect(i18n.t('booking.step_label', { current: 2, total: 6 })).toBe('Langkah 2 daripada 6');
  });

  it('returns the key itself for an unknown key rather than throwing', () => {
    expect(i18n.t('does.not.exist')).toBe('does.not.exist');
  });
});
