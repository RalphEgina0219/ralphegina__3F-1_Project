/**
 * Colour utilities for the shop's brand: WCAG contrast, and a full token scale (hover, soft tint,
 * border, link text, text-on-colour) generated from one chosen colour, for light and dark mode.
 * The contrast rules match laravel-backend/app/Support/Branding.php and share
 * shared/color-cases.json with its tests.
 */

export type Rgb = readonly [number, number, number];
export type Mode = 'light' | 'dark';

export const LIGHT_TEXT = '#ffffff';
export const DARK_TEXT = '#10242e';
/** The surfaces the dark tokens are checked against. */
export const DARK_SURFACE = '#102029';
export const LIGHT_SURFACE = '#ffffff';

export const DEFAULT_BRAND = { primary: '#0e7490', accent: '#3dd6e8', sidebar: '#0b2e3f' } as const;

export const isHex = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);

export function toRgb(hex: string): Rgb {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as unknown as Rgb;
}

export function toHex([r, g, b]: Rgb): string {
  const part = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as unknown as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** White or the app's dark ink, whichever reads better on this colour. */
export function buttonText(hex: string): string {
  return contrast(hex, LIGHT_TEXT) >= contrast(hex, DARK_TEXT) ? LIGHT_TEXT : DARK_TEXT;
}

/** Whether text on this colour reaches 4.5:1. */
export function textReadableOn(hex: string): boolean {
  return contrast(hex, buttonText(hex)) >= 4.5;
}

/** Linear blend: t = 0 is a, t = 1 is b. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

/** Moves toward white (amount > 0) or black (amount < 0). */
export const shade = (hex: string, amount: number) =>
  amount >= 0 ? mix(hex, '#ffffff', amount) : mix(hex, '#000000', -amount);

/** Lightens or darkens until the colour reaches `ratio` against `background`. */
export function ensureContrast(hex: string, background: string, ratio: number): string {
  const lighten = luminance(background) < 0.4;
  let color = hex;
  for (let step = 0; step < 40 && contrast(color, background) < ratio; step += 1) {
    color = shade(color, lighten ? 0.05 : -0.05);
  }
  return color;
}

export interface BrandScale {
  /** Fills: buttons, active tabs. */
  base: string;
  hover: string;
  /** A very light (or very dark) tint for selected rows and soft badges. */
  soft: string;
  line: string;
  /** The colour for links and text on the page surface (4.5:1). */
  text: string;
  /** Text on `base`. */
  onBase: string;
}

/** The full scale for one chosen colour. Dark mode keeps buttons visible and text readable on dark surfaces. */
export function brandScale(hex: string, mode: Mode): BrandScale {
  if (mode === 'light') {
    return {
      base: hex,
      hover: shade(hex, -0.14),
      soft: mix(hex, '#ffffff', 0.9),
      line: mix(hex, '#ffffff', 0.65),
      text: ensureContrast(hex, LIGHT_SURFACE, 4.5),
      onBase: buttonText(hex),
    };
  }
  const base = ensureContrast(hex, DARK_SURFACE, 3);
  return {
    base,
    hover: shade(base, 0.14),
    soft: mix(hex, DARK_SURFACE, 0.82),
    line: mix(hex, DARK_SURFACE, 0.6),
    text: ensureContrast(hex, DARK_SURFACE, 4.5),
    onBase: buttonText(base),
  };
}

export interface BrandColors {
  primary: string;
  accent: string;
  sidebar: string;
}

/** The CSS variables the brand sets on :root (index.css defines the neutral and status ones). */
export function brandTokens(colors: BrandColors, mode: Mode): Record<string, string> {
  const primary = brandScale(colors.primary, mode);
  const sidebar = mode === 'dark' ? mix(colors.sidebar, '#06141b', 0.45) : colors.sidebar;
  const onSidebar = buttonText(sidebar);
  const accent = mode === 'dark' ? ensureContrast(colors.accent, DARK_SURFACE, 3) : colors.accent;
  return {
    '--color-flow': primary.base,
    '--color-flow-hover': primary.hover,
    '--color-flow-soft': primary.soft,
    '--color-flow-line': primary.line,
    '--color-flow-text': primary.text,
    '--color-on-flow': primary.onBase,
    '--color-aqua': accent,
    '--color-ink': sidebar,
    '--color-ink-2': mix(sidebar, onSidebar, 0.16),
    '--color-ink-3': mix(sidebar, onSidebar, 0.08),
    '--color-ink-deep': mix(sidebar, '#000000', 0.35),
    '--color-on-ink': onSidebar,
    '--color-on-ink-muted': mix(onSidebar, sidebar, 0.35),
  };
}

export interface ColorCheck {
  ok: boolean;
  /** Blocks saving: button text on the primary colour cannot be read. */
  blocking: string | null;
  /** Worth a warning but allowed. */
  warnings: string[];
}

/** The contrast report the Branding page shows, for light and dark mode. */
export function checkBrand(colors: BrandColors): ColorCheck {
  const warnings: string[] = [];
  let blocking: string | null = null;
  if (!textReadableOn(colors.primary)) {
    blocking =
      'Text on the primary color would be hard to read (it needs 4.5:1). Choose a darker or lighter color.';
  }
  if (!textReadableOn(colors.sidebar)) {
    blocking ??=
      'Text on the sidebar color would be hard to read. Choose a darker or lighter color.';
  }
  for (const mode of ['light', 'dark'] as const) {
    const scale = brandScale(colors.primary, mode);
    if (contrast(scale.base, scale.onBase) < 4.5) {
      blocking ??= `Primary buttons would be unreadable in ${mode} mode.`;
    }
    const surface = mode === 'light' ? LIGHT_SURFACE : DARK_SURFACE;
    if (contrast(scale.text, surface) < 4.5) {
      warnings.push(`Links in the primary color are hard to read in ${mode} mode.`);
    }
  }
  if (contrast(colors.primary, LIGHT_SURFACE) < 3) {
    warnings.push(
      'The primary color is light on a white page: it is adjusted for links, but buttons and icons may look faint.',
    );
  }
  return { ok: blocking === null, blocking, warnings };
}
