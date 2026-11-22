import { brandTokens, DEFAULT_BRAND, type Mode } from '@/lib/color';
import { applyStatusLabels, DEFAULT_STATUS_LABELS } from '@/lib/status';
import type { BrandingDto } from '@/types/api';

/** Exactly today's LaundryFlow look: what a shop that has not branded anything gets. */
export const DEFAULT_BRANDING: BrandingDto = {
  system_name: 'LaundryFlow',
  short_name: 'LaundryFlow',
  tagline: null,
  logo_url: null,
  logo_dark_url: null,
  icon_urls: null,
  primary_color: DEFAULT_BRAND.primary,
  accent_color: DEFAULT_BRAND.accent,
  sidebar_color: DEFAULT_BRAND.sidebar,
  button_text_color: '#ffffff',
  status_labels: { ...DEFAULT_STATUS_LABELS },
  basket_prefix: 'BSK',
  basket_label_footer: 'Staff scan only',
  basket_label_show_shop_name: true,
  pay_at_pickup_enabled: true,
  payment_methods: [
    { code: 'cash', label: 'Cash', is_active: true },
    { code: 'gcash', label: 'GCash', is_active: true },
    { code: 'maya', label: 'Maya', is_active: true },
  ],
  login_message: null,
  portal_message: null,
  report_footer: null,
  show_powered_by: false,
  shop: {
    name: 'LaundryFlow',
    address: '',
    contact_number: '',
    opening_hours: '',
    contact_email: null,
  },
  version: 'default',
};

const CACHE_KEY = 'laundryflow.branding.v1';
const TOKEN_NAMES = [
  '--color-flow',
  '--color-flow-hover',
  '--color-flow-soft',
  '--color-flow-line',
  '--color-flow-text',
  '--color-on-flow',
  '--color-aqua',
  '--color-ink',
  '--color-ink-2',
  '--color-ink-3',
  '--color-ink-deep',
  '--color-on-ink',
  '--color-on-ink-muted',
];

/** The last branding the server sent, so the next visit paints with it at once. */
export function readCachedBranding(): BrandingDto | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as BrandingDto) : null;
    return parsed && typeof parsed.system_name === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function cacheBranding(branding: BrandingDto) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(branding));
  } catch {
    // Blocked or full storage: the next visit starts from the defaults and refreshes.
  }
}

/** True when the shop picked its own colours (otherwise index.css's tuned defaults apply, light and dark). */
export const hasCustomColors = (b: BrandingDto) =>
  b.primary_color.toLowerCase() !== DEFAULT_BRAND.primary ||
  b.accent_color.toLowerCase() !== DEFAULT_BRAND.accent ||
  b.sidebar_color.toLowerCase() !== DEFAULT_BRAND.sidebar;

function setMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.append(element);
  }
  element.content = content;
}

function setLink(selector: string, attributes: Record<string, string>) {
  let element = document.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.append(element);
  }
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
}

/** The base of every page title: "<page> · <system name>". */
let currentName = DEFAULT_BRANDING.system_name;
export const brandName = () => currentName;

let currentFooter: string | null = null;
/** The footer of printed reports: the shop's own text, else "<name> report". */
export const reportFooter = () => (currentFooter ?? `${currentName} report`).replace(/["\\]/g, '');

/** "Suds & Co" -> "suds-co": the start of CSV and image file names. */
export const brandSlug = () =>
  currentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'laundryflow';

/** Writes the branding to the page: colours, tab title, icons, theme colour and status labels. */
export function applyBranding(branding: BrandingDto, mode: Mode) {
  const root = document.documentElement;
  for (const name of TOKEN_NAMES) root.style.removeProperty(name);
  if (hasCustomColors(branding)) {
    const tokens = brandTokens(
      {
        primary: branding.primary_color,
        accent: branding.accent_color,
        sidebar: branding.sidebar_color,
      },
      mode,
    );
    for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
  }

  currentName = branding.system_name;
  currentFooter = branding.report_footer;
  const title = document.title;
  if (!title || title === DEFAULT_BRANDING.system_name || title.endsWith(' · LaundryFlow')) {
    document.title = title.endsWith(' · LaundryFlow')
      ? `${title.slice(0, -' · LaundryFlow'.length)} · ${branding.system_name}`
      : branding.system_name;
  }
  setMeta('apple-mobile-web-app-title', branding.short_name);
  setMeta(
    'theme-color',
    getComputedStyle(root).getPropertyValue('--color-ink').trim() || branding.sidebar_color,
  );
  const icons = branding.icon_urls;
  if (icons) {
    if (icons.favicon32) {
      setLink('link[rel="icon"][data-brand]', {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: icons.favicon32,
        'data-brand': 'true',
      });
    }
    if (icons.apple)
      setLink('link[rel="apple-touch-icon"]', { rel: 'apple-touch-icon', href: icons.apple });
  } else {
    document.querySelector('link[rel="icon"][data-brand]')?.remove();
    setLink('link[rel="apple-touch-icon"]', {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon-180x180.png',
    });
  }
  applyStatusLabels(branding.status_labels);
}
