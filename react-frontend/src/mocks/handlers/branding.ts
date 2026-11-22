import { DEFAULT_BRANDING } from '@/features/branding/branding';
import { isHex, textReadableOn } from '@/lib/color';
import { applyStatusLabels, STATUS_ORDER } from '@/lib/status';
import type { BrandingAdminDto, BrandingDto, SetupItemDto } from '@/types/api';
import type { PaymentMethodCode } from '@/types/entities';
import { db } from '../db';
import { asString, fail, invalid, ok, publicRoute, route } from '../http';
import { audit } from '../queries';

const KINDS = ['logo', 'logo-dark', 'icon'] as const;
type Kind = (typeof KINDS)[number];
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** The editable branding fields, reset to the LaundryFlow look. */
export const brandingDefaults = () => ({
  system_name: DEFAULT_BRANDING.system_name,
  short_name: DEFAULT_BRANDING.short_name,
  tagline: null as string | null,
  logo_url: null as string | null,
  logo_dark_url: null as string | null,
  icon_url: null as string | null,
  primary_color: DEFAULT_BRANDING.primary_color,
  accent_color: DEFAULT_BRANDING.accent_color,
  sidebar_color: DEFAULT_BRANDING.sidebar_color,
  contact_email: null as string | null,
  show_contact_email: false,
  login_message: null as string | null,
  portal_message: null as string | null,
  report_footer: null as string | null,
  status_labels: { ...DEFAULT_BRANDING.status_labels },
  basket_prefix: 'BSK',
  basket_label_footer: 'Staff scan only' as string | null,
  basket_label_show_shop_name: true,
  pay_at_pickup_enabled: true,
  show_powered_by: false,
  ticked: {} as Record<string, boolean>,
});
export type StoredBranding = ReturnType<typeof brandingDefaults>;

const textOn = (hex: string) => (textReadableOn(hex) ? '' : 'x');

function version(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function publicBranding(): BrandingDto {
  const b = db().branding;
  const shop = db().shop_settings;
  const icon = b.icon_url ?? b.logo_url;
  const body: Omit<BrandingDto, 'version'> = {
    system_name: b.system_name,
    short_name: b.short_name,
    tagline: b.tagline,
    logo_url: b.logo_url,
    logo_dark_url: b.logo_dark_url,
    icon_urls: icon
      ? { '192': icon, '512': icon, maskable: icon, apple: icon, favicon32: icon, favicon16: icon }
      : null,
    primary_color: b.primary_color,
    accent_color: b.accent_color,
    sidebar_color: b.sidebar_color,
    button_text_color:
      textReadableOn(b.primary_color) && b.primary_color === '#0e7490' ? '#ffffff' : '#ffffff',
    status_labels: b.status_labels,
    basket_prefix: b.basket_prefix,
    basket_label_footer: b.basket_label_footer,
    basket_label_show_shop_name: b.basket_label_show_shop_name,
    pay_at_pickup_enabled: b.pay_at_pickup_enabled,
    payment_methods: db().payment_methods.map((m) => ({
      code: m.code,
      label: m.display_label ?? m.label,
      is_active: m.is_active,
    })),
    login_message: b.login_message,
    portal_message: b.portal_message,
    report_footer: b.report_footer,
    show_powered_by: b.show_powered_by,
    shop: {
      name: shop.name,
      address: shop.address,
      contact_number: shop.contact_number,
      opening_hours: shop.opening_hours,
      contact_email: b.show_contact_email ? b.contact_email : null,
    },
  };
  return { ...body, version: version(body) };
}

function checklist(): SetupItemDto[] {
  const b = db().branding;
  const shop = db().shop_settings;
  const t = b.ticked;
  const branded =
    Boolean(b.logo_url || b.icon_url) ||
    b.system_name !== 'LaundryFlow' ||
    b.primary_color !== '#0e7490';
  const contact = shop.contact_number.trim() !== '' && !shop.contact_number.startsWith('[');
  return [
    {
      key: 'branding',
      label: 'Upload your logo and choose your colors',
      done: branded || Boolean(t.branding),
      auto: true,
      link: '/settings/branding',
    },
    {
      key: 'shop',
      label: 'Fill in the shop details',
      done: contact || Boolean(t.shop),
      auto: true,
      link: '/settings/shop',
    },
    {
      key: 'rates',
      label: 'Set your service rates',
      done: Boolean(t.rates),
      auto: false,
      link: '/settings/pricing',
    },
    {
      key: 'soaps',
      label: 'Assign soaps to wash types',
      done: db().wash_type_supplies.length > 0 || Boolean(t.soaps),
      auto: true,
      link: '/settings/pricing',
    },
    {
      key: 'staff',
      label: 'Add your staff',
      done: Boolean(t.staff),
      auto: false,
      link: '/settings/users',
    },
    {
      key: 'labels',
      label: 'Print the basket labels',
      done: Boolean(t.labels),
      auto: false,
      link: '/settings/baskets',
    },
  ];
}

export function adminBranding(): BrandingAdminDto {
  const b = db().branding;
  return {
    ...publicBranding(),
    contact_email: b.contact_email,
    show_contact_email: b.show_contact_email,
    has_logo: b.logo_url !== null,
    has_logo_dark: b.logo_dark_url !== null,
    has_icon: b.icon_url !== null,
    setup_checklist: checklist(),
  };
}

const NAMES: Record<string, string> = {
  system_name: 'system name',
  short_name: 'short name',
  tagline: 'tagline',
  primary_color: 'primary color',
  accent_color: 'accent color',
  sidebar_color: 'sidebar color',
  contact_email: 'contact email',
  login_message: 'login message',
  portal_message: 'portal message',
  report_footer: 'report footer',
  basket_prefix: 'basket prefix',
  basket_label_footer: 'basket label footer',
  status_labels: 'status labels',
  pay_at_pickup_enabled: 'Pay at pickup',
  show_powered_by: 'powered-by line',
  show_contact_email: 'show contact email',
  basket_label_show_shop_name: 'shop name on basket labels',
};

/** The same rules as Laravel's UpdateBrandingRequest. */
function validate(body: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  const text = (key: string, max: number, required = false) => {
    if (!(key in body)) return;
    const value = asString(body[key]);
    if (required && !value) errors[key] = 'Enter a value.';
    else if (value.length > max) errors[key] = `Use at most ${max} characters.`;
  };
  text('system_name', 60, true);
  text('short_name', 12, true);
  text('tagline', 120);
  text('login_message', 300);
  text('portal_message', 300);
  text('report_footer', 300);
  text('basket_label_footer', 80);
  for (const key of ['primary_color', 'accent_color', 'sidebar_color']) {
    if (key in body && !isHex(body[key])) errors[key] = 'Use a color like #0e7490.';
  }
  for (const key of ['primary_color', 'sidebar_color']) {
    if (!errors[key] && key in body && textOn(String(body[key]))) {
      errors[key] =
        `Text on the ${key === 'primary_color' ? 'primary' : 'sidebar'} color would be hard to read. Choose a darker or lighter color.`;
    }
  }
  if (
    'contact_email' in body &&
    asString(body.contact_email) &&
    !/^\S+@\S+\.\S+$/.test(asString(body.contact_email))
  ) {
    errors.contact_email = 'Enter a valid email address.';
  }
  if ('basket_prefix' in body && !/^[A-Za-z]{2,8}$/.test(asString(body.basket_prefix))) {
    errors.basket_prefix = 'Use 2 to 8 letters, like BSK.';
  }
  if (body.status_labels && typeof body.status_labels === 'object') {
    const labels = body.status_labels as Record<string, unknown>;
    const seen = new Set<string>();
    for (const code of STATUS_ORDER) {
      const label = asString(labels[code]);
      const key = `status_labels.${code}`;
      if (!label) errors[key] = 'Enter a label.';
      else if (label.length > 24) errors[key] = 'Use at most 24 characters.';
      else if (seen.has(label.toLowerCase())) errors[key] = 'Each status needs its own label.';
      seen.add(label.toLowerCase());
    }
  }
  if (Array.isArray(body.payment_methods) || 'pay_at_pickup_enabled' in body) {
    const active = new Map(db().payment_methods.map((m) => [m.code as string, m.is_active]));
    for (const row of (body.payment_methods ?? []) as { code: string; is_active: boolean }[]) {
      active.set(row.code, row.is_active !== false);
    }
    const pickup =
      'pay_at_pickup_enabled' in body
        ? body.pay_at_pickup_enabled !== false
        : db().branding.pay_at_pickup_enabled;
    if (![...active.values()].some(Boolean) && !pickup)
      errors.payment_methods = 'At least one way to pay must stay on.';
  }
  return errors;
}

export const brandingHandlers = [
  publicRoute('get', '/branding', () => ok(publicBranding())),

  route('get', '/settings/branding', 'settings.manage', () => ok(adminBranding())),

  route('put', '/settings/branding', 'settings.manage', ({ user, body }) => {
    const errors = validate(body);
    if (Object.keys(errors).length > 0) return invalid(errors);
    const stored = db().branding as Record<string, unknown>;
    const before = { ...stored };
    const changed: string[] = [];
    for (const key of Object.keys(NAMES)) {
      if (!(key in body)) continue;
      let value = body[key];
      if (typeof value === 'string') value = value.trim();
      if (value === '' && !['system_name', 'short_name', 'basket_prefix'].includes(key))
        value = null;
      if (['primary_color', 'accent_color', 'sidebar_color'].includes(key))
        value = String(value).toLowerCase();
      if (key === 'basket_prefix') value = String(value).toUpperCase();
      if (JSON.stringify(stored[key]) !== JSON.stringify(value)) changed.push(key);
      stored[key] = value;
    }
    if (Array.isArray(body.payment_methods)) {
      for (const row of body.payment_methods as {
        code: PaymentMethodCode;
        is_active: boolean;
        label?: string;
      }[]) {
        const method = db().payment_methods.find((m) => m.code === row.code);
        if (method) {
          method.is_active = row.is_active !== false;
          method.display_label = row.label?.trim() ? row.label.trim() : null;
        }
      }
      changed.push('payment_methods');
    }
    applyStatusLabels(db().branding.status_labels);
    if (changed.length > 0) {
      audit(
        user.id,
        'branding.updated',
        'shop_settings',
        1,
        {
          summary: `updated branding: ${changed.map((c) => NAMES[c] ?? 'payment methods').join(', ')}`,
        },
        Object.fromEntries(changed.filter((c) => c in before).map((c) => [c, before[c]])),
      );
    }
    return ok(adminBranding());
  }),

  route('post', '/settings/branding/reset', 'settings.manage', ({ user }) => {
    db().branding = brandingDefaults();
    for (const method of db().payment_methods) {
      method.is_active = true;
      method.display_label = null;
    }
    applyStatusLabels(db().branding.status_labels);
    audit(user.id, 'branding.reset', 'shop_settings', 1, {
      summary: 'reset the branding to the LaundryFlow defaults',
    });
    return ok(adminBranding());
  }),

  // Uploads: the mock keeps the image as a data URL (the server re-encodes and hashes the file).
  route('post', '/settings/branding/:kind', 'settings.manage', async ({ user, params, body }) => {
    const kind = params.kind as Kind;
    if (!KINDS.includes(kind)) return fail(404, 'Not found.');
    const file = body.file as Blob | undefined;
    if (typeof file !== 'object' || typeof file?.arrayBuffer !== 'function')
      return invalid({ file: 'Choose an image.' });
    if (!TYPES.includes(file.type))
      return invalid({ file: 'Upload a PNG, JPG or WebP image (SVG is not allowed).' });
    if (file.size > 2 * 1024 * 1024) return invalid({ file: 'The image must be 2 MB or smaller.' });
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
    const url = `data:${file.type};base64,${btoa(binary)}`;
    const key = kind === 'logo' ? 'logo_url' : kind === 'logo-dark' ? 'logo_dark_url' : 'icon_url';
    db().branding[key] = url;
    audit(user.id, 'branding.updated', 'shop_settings', 1, { summary: `uploaded a new ${kind}` });
    return ok(adminBranding());
  }),

  route('delete', '/settings/branding/:kind', 'settings.manage', ({ user, params }) => {
    const kind = params.kind as Kind;
    if (!KINDS.includes(kind)) return fail(404, 'Not found.');
    const key = kind === 'logo' ? 'logo_url' : kind === 'logo-dark' ? 'logo_dark_url' : 'icon_url';
    db().branding[key] = null;
    audit(user.id, 'branding.updated', 'shop_settings', 1, { summary: `removed the ${kind}` });
    return ok(adminBranding());
  }),

  route('put', '/settings/setup-checklist', 'settings.manage', ({ body }) => {
    const key = asString(body.key);
    if (!['branding', 'shop', 'rates', 'soaps', 'staff', 'labels'].includes(key))
      return invalid({ key: 'Unknown item.' });
    db().branding.ticked[key] = body.done === true;
    return ok(adminBranding());
  }),
];
