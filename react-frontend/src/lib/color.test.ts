import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DARK_SURFACE,
  LIGHT_SURFACE,
  brandScale,
  brandTokens,
  buttonText,
  checkBrand,
  contrast,
  ensureContrast,
  isHex,
  textReadableOn,
} from './color';

// The same cases as laravel-backend/tests/Unit/BrandingColorTest.php.
const cases = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../../../shared/color-cases.json'), 'utf8'),
) as {
  contrast: { a: string; b: string; ratio: number }[];
  buttonText: { color: string; text: string; readable: boolean }[];
};

describe('contrast', () => {
  it.each(cases.contrast)('$a on $b is $ratio:1', ({ a, b, ratio }) => {
    expect(contrast(a, b)).toBeCloseTo(ratio, 2);
  });
});

describe('button text', () => {
  it.each(cases.buttonText)('picks $text on $color (readable: $readable)', (row) => {
    expect(buttonText(row.color)).toBe(row.text);
    expect(textReadableOn(row.color)).toBe(row.readable);
  });

  it('accepts only #RRGGBB hex', () => {
    expect(isHex('#0e7490')).toBe(true);
    expect(isHex('0e7490')).toBe(false);
    expect(isHex('#0e749')).toBe(false);
  });
});

describe('the generated scale', () => {
  const colors = ['#0e7490', '#7c3aed', '#f5c518', '#b91c1c', '#0b2e3f', '#3dd6e8', '#2e7d32'];

  it.each(colors)('%s keeps text readable on its button and on the page, in both modes', (hex) => {
    const light = brandScale(hex, 'light');
    expect(contrast(light.base, light.onBase)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light.text, LIGHT_SURFACE)).toBeGreaterThanOrEqual(4.5);

    const dark = brandScale(hex, 'dark');
    expect(contrast(dark.base, dark.onBase)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.text, DARK_SURFACE)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.base, DARK_SURFACE)).toBeGreaterThanOrEqual(3);
  });

  it('keeps the default teal exactly as it is today in light mode', () => {
    const tokens = brandTokens(
      { primary: '#0e7490', accent: '#3dd6e8', sidebar: '#0b2e3f' },
      'light',
    );
    expect(tokens['--color-flow']).toBe('#0e7490');
    expect(tokens['--color-flow-text']).toBe('#0e7490');
    expect(tokens['--color-on-flow']).toBe('#ffffff');
    expect(tokens['--color-ink']).toBe('#0b2e3f');
    expect(tokens['--color-aqua']).toBe('#3dd6e8');
  });

  it('lightens a dark colour until it reaches the ratio', () => {
    const lifted = ensureContrast('#0b2e3f', DARK_SURFACE, 4.5);
    expect(contrast(lifted, DARK_SURFACE)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('the brand check', () => {
  it('accepts the default colors', () => {
    const check = checkBrand({ primary: '#0e7490', accent: '#3dd6e8', sidebar: '#0b2e3f' });
    expect(check.ok).toBe(true);
    expect(check.warnings).toEqual([]);
  });

  it('blocks a primary color that makes button text unreadable', () => {
    const check = checkBrand({ primary: '#777777', accent: '#3dd6e8', sidebar: '#0b2e3f' });
    expect(check.ok).toBe(false);
    expect(check.blocking).toContain('primary color');
  });

  it('warns about a pale primary color but allows it', () => {
    const check = checkBrand({ primary: '#f5c518', accent: '#3dd6e8', sidebar: '#0b2e3f' });
    expect(check.ok).toBe(true);
    expect(check.warnings.length).toBeGreaterThan(0);
  });
});
