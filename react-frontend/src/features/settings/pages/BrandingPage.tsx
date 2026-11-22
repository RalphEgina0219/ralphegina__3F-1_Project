import { ImageUp, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { ErrorState, SkeletonRows } from '@/components/ui/States';
import { Switch } from '@/components/ui/Switch';
import {
  useBrandingAdmin,
  useRemoveBrandingFile,
  useResetBranding,
  useSaveBranding,
  useUploadBrandingFile,
  type BrandingFile,
} from '@/features/branding/api';
import { BrandPreview } from '@/features/branding/BrandPreview';
import { applyFieldErrors, errorMessage } from '@/lib/api';
import { checkBrand, isHex } from '@/lib/color';
import { STATUS_ORDER } from '@/lib/status';
import { useUnsavedChanges } from '@/lib/unsaved';
import type { BrandingAdminDto, BrandingInput } from '@/types/api';
import type { StatusCode } from '@/types/entities';

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = 'image/png,image/jpeg,image/webp';

interface Draft {
  system_name: string;
  short_name: string;
  tagline: string;
  primary_color: string;
  accent_color: string;
  sidebar_color: string;
  contact_email: string;
  show_contact_email: boolean;
  login_message: string;
  portal_message: string;
  report_footer: string;
  status_labels: Record<StatusCode, string>;
  basket_prefix: string;
  basket_label_footer: string;
  basket_label_show_shop_name: boolean;
  pay_at_pickup_enabled: boolean;
  show_powered_by: boolean;
  methods: Record<string, { is_active: boolean; label: string }>;
}

function toDraft(b: BrandingAdminDto): Draft {
  return {
    system_name: b.system_name,
    short_name: b.short_name,
    tagline: b.tagline ?? '',
    primary_color: b.primary_color,
    accent_color: b.accent_color,
    sidebar_color: b.sidebar_color,
    contact_email: b.contact_email ?? '',
    show_contact_email: b.show_contact_email,
    login_message: b.login_message ?? '',
    portal_message: b.portal_message ?? '',
    report_footer: b.report_footer ?? '',
    status_labels: { ...b.status_labels },
    basket_prefix: b.basket_prefix,
    basket_label_footer: b.basket_label_footer ?? '',
    basket_label_show_shop_name: b.basket_label_show_shop_name,
    pay_at_pickup_enabled: b.pay_at_pickup_enabled,
    show_powered_by: b.show_powered_by,
    methods: Object.fromEntries(
      b.payment_methods.map((m) => [m.code, { is_active: m.is_active, label: m.label }]),
    ),
  };
}

/** The shop's defaults for a method's label: what it is called before the shop renames it. */
const BASE_LABEL: Record<string, string> = { cash: 'Cash', gcash: 'GCash', maya: 'Maya' };

function ColorField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      {(field) => (
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={`${label} picker`}
            value={isHex(value) ? value : '#000000'}
            onChange={(event) => onChange(event.target.value)}
            className="size-11 shrink-0 cursor-pointer rounded-control border border-line-strong bg-surface p-1"
          />
          <Input
            {...field}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            maxLength={7}
            spellCheck={false}
            autoComplete="off"
            className="font-mono"
          />
        </div>
      )}
    </Field>
  );
}

function FileSlot({
  kind,
  title,
  help,
  url,
  has,
  onFile,
  onRemove,
  busy,
}: {
  kind: BrandingFile;
  title: string;
  help: string;
  url: string | null;
  has: boolean;
  onFile: (kind: BrandingFile, file: File) => void;
  onRemove: (kind: BrandingFile) => void;
  busy: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-card border border-line p-3" data-testid={`slot-${kind}`}>
      <p className="text-[13px] font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-muted">{help}</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-control border border-line bg-white">
          {url ? (
            <img src={url} alt={`${title} preview`} className="size-full object-contain" />
          ) : (
            <ImageUp className="size-6 text-muted" aria-hidden="true" />
          )}
        </span>
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            aria-label={`Upload ${title}`}
            className="sr-only"
            data-testid={`file-${kind}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(kind, file);
              event.target.value = '';
            }}
          />
          <Button
            variant="secondary"
            loading={busy}
            needsNetwork
            onClick={() => input.current?.click()}
          >
            {has ? 'Replace' : 'Upload'}
          </Button>
          {has && (
            <Button
              variant="ghost"
              icon={<Trash2 className="size-4" aria-hidden="true" />}
              needsNetwork
              onClick={() => onRemove(kind)}
              aria-label={`Remove ${title}`}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandingPage() {
  useDocumentTitle('Branding & Appearance');
  const query = useBrandingAdmin();
  const save = useSaveBranding();
  const upload = useUploadBrandingFile();
  const remove = useRemoveBrandingFile();
  const reset = useResetBranding();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState(false);
  const loaded = query.data;

  useEffect(() => {
    if (loaded) setDraft(toDraft(loaded));
    // Re-read after every save, upload and reset.
  }, [loaded]);

  const saved = useMemo(() => (loaded ? toDraft(loaded) : null), [loaded]);
  const dirty = Boolean(draft && saved && JSON.stringify(draft) !== JSON.stringify(saved));
  useUnsavedChanges(dirty);

  const colors = draft
    ? { primary: draft.primary_color, accent: draft.accent_color, sidebar: draft.sidebar_color }
    : null;
  const brand = useMemo(
    () =>
      colors && [colors.primary, colors.accent, colors.sidebar].every(isHex)
        ? checkBrand(colors)
        : null,
    // colors is rebuilt every render; its three values are what matter
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft?.primary_color, draft?.accent_color, draft?.sidebar_color],
  );

  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!draft || !loaded || !colors) return <SkeletonRows rows={8} />;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft({ ...draft, [key]: value });

  const onFile = (kind: BrandingFile, file: File) => {
    if (!ACCEPT.split(',').includes(file.type)) {
      toast.error('Upload a PNG, JPG or WebP image (SVG is not allowed).');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('The image must be 2 MB or smaller.');
      return;
    }
    upload.mutate(
      { kind, file },
      {
        onSuccess: () => toast.success('Image saved'),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  const problems = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!draft.system_name.trim()) next.system_name = 'Enter the system name.';
    if (!draft.short_name.trim()) next.short_name = 'Enter a short name.';
    if (draft.short_name.length > 12) next.short_name = 'The short name is at most 12 characters.';
    for (const [key, value] of [
      ['primary_color', draft.primary_color],
      ['accent_color', draft.accent_color],
      ['sidebar_color', draft.sidebar_color],
    ] as const) {
      if (!isHex(value)) next[key] = 'Use a color like #0e7490.';
    }
    if (brand?.blocking) next.primary_color ??= brand.blocking;
    if (!/^[A-Za-z]{2,8}$/.test(draft.basket_prefix))
      next.basket_prefix = 'Use 2 to 8 letters, like BSK.';
    const seen = new Set<string>();
    for (const code of STATUS_ORDER) {
      const label = draft.status_labels[code].trim();
      const key = `status_labels.${code}`;
      if (!label) next[key] = 'Enter a label.';
      else if (label.length > 24) next[key] = 'Use at most 24 characters.';
      else if (seen.has(label.toLowerCase())) next[key] = 'Each status needs its own label.';
      seen.add(label.toLowerCase());
    }
    const anyOn =
      Object.values(draft.methods).some((m) => m.is_active) || draft.pay_at_pickup_enabled;
    if (!anyOn) next.methods = 'At least one way to pay must stay on.';
    return next;
  };

  const onSave = () => {
    const found = problems();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Check the highlighted fields.');
      return;
    }
    const input: BrandingInput = {
      system_name: draft.system_name.trim(),
      short_name: draft.short_name.trim(),
      tagline: draft.tagline.trim() || null,
      primary_color: draft.primary_color.toLowerCase(),
      accent_color: draft.accent_color.toLowerCase(),
      sidebar_color: draft.sidebar_color.toLowerCase(),
      contact_email: draft.contact_email.trim() || null,
      show_contact_email: draft.show_contact_email,
      login_message: draft.login_message.trim() || null,
      portal_message: draft.portal_message.trim() || null,
      report_footer: draft.report_footer.trim() || null,
      status_labels: Object.fromEntries(
        STATUS_ORDER.map((code) => [code, draft.status_labels[code].trim()]),
      ) as Record<StatusCode, string>,
      basket_prefix: draft.basket_prefix.toUpperCase(),
      basket_label_footer: draft.basket_label_footer.trim() || null,
      basket_label_show_shop_name: draft.basket_label_show_shop_name,
      pay_at_pickup_enabled: draft.pay_at_pickup_enabled,
      show_powered_by: draft.show_powered_by,
      payment_methods: Object.entries(draft.methods).map(([code, m]) => ({
        code: code as 'cash' | 'gcash' | 'maya',
        is_active: m.is_active,
        label: m.label.trim() === (BASE_LABEL[code] ?? '') ? '' : m.label.trim(),
      })),
    };
    save.mutate(input, {
      onSuccess: () => {
        toast.success('Branding saved');
        setErrors({});
      },
      onError: (error) => {
        const collected: Record<string, string> = {};
        const applied = applyFieldErrors(error, ((field: string, value: { message?: string }) => {
          collected[field.replace(/^payment_methods\.\d+\./, 'methods')] = value.message ?? '';
        }) as never);
        if (applied) setErrors(collected);
        else toast.error(errorMessage(error));
      },
    });
  };

  const field = (key: string) => errors[key];

  return (
    <div
      className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start"
      data-testid="branding-page"
    >
      <div className="min-w-0 space-y-5">
        <p className="rounded-control border border-line bg-foam px-4 py-3 text-sm font-semibold">
          Make the system yours: name, logo, colors, labels and options. It all applies right after
          you save, to staff and customers alike.
        </p>

        <Card className="p-4 md:p-5">
          <CardHeader title="Name and logo" className="mb-3" />
          <div className="grid gap-3 md:grid-cols-2">
            <Field
              label="System name"
              required
              error={field('system_name')}
              hint="Sidebar, login page, browser tab and the installed app."
            >
              {(f) => (
                <Input
                  {...f}
                  value={draft.system_name}
                  maxLength={60}
                  onChange={(e) => set('system_name', e.target.value)}
                />
              )}
            </Field>
            <Field
              label="Short name"
              required
              error={field('short_name')}
              hint={`${draft.short_name.length}/12: the label under the phone home-screen icon.`}
            >
              {(f) => (
                <Input
                  {...f}
                  value={draft.short_name}
                  maxLength={12}
                  onChange={(e) => set('short_name', e.target.value)}
                />
              )}
            </Field>
            <Field
              label="Tagline"
              className="md:col-span-2"
              hint="Optional. Shown under the name on the sign-in page."
            >
              {(f) => (
                <Input
                  {...f}
                  value={draft.tagline}
                  maxLength={120}
                  onChange={(e) => set('tagline', e.target.value)}
                />
              )}
            </Field>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <FileSlot
              kind="logo"
              title="Logo"
              help="For light backgrounds. PNG, JPG or WebP, up to 2 MB, at least 128 px."
              url={loaded.logo_url}
              has={loaded.has_logo}
              onFile={onFile}
              onRemove={(k) => remove.mutate(k)}
              busy={upload.isPending}
            />
            <FileSlot
              kind="logo-dark"
              title="Logo for dark mode"
              help="Optional. Without it, the logo sits on a light chip in dark mode."
              url={loaded.logo_dark_url}
              has={loaded.has_logo_dark}
              onFile={onFile}
              onRemove={(k) => remove.mutate(k)}
              busy={upload.isPending}
            />
            <FileSlot
              kind="icon"
              title="App icon"
              help="Square, at least 512 × 512. The phone icons and favicon are made from it."
              url={loaded.icon_urls?.['512'] ?? null}
              has={loaded.has_icon}
              onFile={onFile}
              onRemove={(k) => remove.mutate(k)}
              busy={upload.isPending}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Phones that already installed the app may keep the old icon or name until the app is
            installed again: that is how phones work.
          </p>
        </Card>

        <Card className="p-4 md:p-5">
          <CardHeader title="Theme colors" className="mb-3" />
          <div className="grid gap-3 md:grid-cols-3">
            <ColorField
              label="Primary color"
              value={draft.primary_color}
              onChange={(v) => set('primary_color', v)}
              error={field('primary_color')}
            />
            <ColorField
              label="Accent color"
              value={draft.accent_color}
              onChange={(v) => set('accent_color', v)}
              error={field('accent_color')}
            />
            <ColorField
              label="Sidebar / header color"
              value={draft.sidebar_color}
              onChange={(v) => set('sidebar_color', v)}
              error={field('sidebar_color')}
            />
          </div>
          <div
            className="mt-3 space-y-1 text-[13px]"
            aria-live="polite"
            data-testid="contrast-report"
          >
            {brand?.blocking && <p className="font-semibold text-danger">{brand.blocking}</p>}
            {brand?.warnings.map((w) => (
              <p key={w} className="text-warn">
                {w}
              </p>
            ))}
            {brand?.ok && brand.warnings.length === 0 && (
              <p className="text-ok">Text stays readable in light and dark mode.</p>
            )}
            <p className="text-muted">
              Charts keep their own fixed, color-blind-safe colors, and status colors keep their
              meaning: the brand never recolors data.
            </p>
          </div>
          <Button
            variant="ghost"
            className="mt-2"
            onClick={() =>
              setDraft({
                ...draft,
                primary_color: '#0e7490',
                accent_color: '#3dd6e8',
                sidebar_color: '#0b2e3f',
              })
            }
          >
            Use the LaundryFlow colors
          </Button>
        </Card>

        <Card className="p-4 md:p-5">
          <CardHeader title="Shop details and messages" className="mb-3" />
          <p className="mb-3 text-[13px] text-muted">
            The shop name, address, contact number, opening hours and receipt footer are in{' '}
            <Link to="/settings/shop" className="font-semibold text-flow-text underline">
              Shop profile
            </Link>
            .
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Contact email" error={field('contact_email')}>
              {(f) => (
                <Input
                  {...f}
                  type="email"
                  value={draft.contact_email}
                  onChange={(e) => set('contact_email', e.target.value)}
                />
              )}
            </Field>
            <div className="flex items-center justify-between gap-3 md:mt-6.5">
              <span className="text-sm font-semibold">Show the email on the public pages</span>
              <Switch
                checked={draft.show_contact_email}
                onCheckedChange={(v) => set('show_contact_email', v)}
                aria-label="Show the email on the public pages"
              />
            </div>
            <Field label="Login page welcome message" className="md:col-span-2">
              {(f) => (
                <Input
                  {...f}
                  value={draft.login_message}
                  maxLength={300}
                  onChange={(e) => set('login_message', e.target.value)}
                />
              )}
            </Field>
            <Field
              label="Customer portal message"
              className="md:col-span-2"
              hint='For example "Pickup hours: 8 AM – 7 PM".'
            >
              {(f) => (
                <Input
                  {...f}
                  value={draft.portal_message}
                  maxLength={300}
                  onChange={(e) => set('portal_message', e.target.value)}
                />
              )}
            </Field>
            <Field label="Footer text for printed reports" className="md:col-span-2">
              {(f) => (
                <Input
                  {...f}
                  value={draft.report_footer}
                  maxLength={300}
                  onChange={(e) => set('report_footer', e.target.value)}
                />
              )}
            </Field>
            <div className="flex items-center justify-between gap-3 md:col-span-2">
              <span className="text-sm font-semibold">
                Show a small &quot;Powered by LaundryFlow&quot; line
              </span>
              <Switch
                checked={draft.show_powered_by}
                onCheckedChange={(v) => set('show_powered_by', v)}
                aria-label="Show powered by LaundryFlow"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-5">
          <CardHeader title="Labels and options" className="mb-3" />
          <p className="text-[13px] font-semibold">Laundry status labels</p>
          <p className="mb-2 text-xs text-muted">
            What each stage is called on screen. The stages and their order never change.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {STATUS_ORDER.map((code, index) => (
              <Field key={code} label={`Stage ${index + 1}`} error={field(`status_labels.${code}`)}>
                {(f) => (
                  <Input
                    {...f}
                    value={draft.status_labels[code]}
                    maxLength={24}
                    onChange={(e) =>
                      set('status_labels', { ...draft.status_labels, [code]: e.target.value })
                    }
                  />
                )}
              </Field>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field
              label="Basket number prefix"
              error={field('basket_prefix')}
              hint="Applies to new baskets only; existing numbers stay as they are."
            >
              {(f) => (
                <Input
                  {...f}
                  value={draft.basket_prefix}
                  maxLength={8}
                  className="font-mono uppercase"
                  onChange={(e) => set('basket_prefix', e.target.value)}
                />
              )}
            </Field>
            <Field label="Basket label footer">
              {(f) => (
                <Input
                  {...f}
                  value={draft.basket_label_footer}
                  maxLength={80}
                  onChange={(e) => set('basket_label_footer', e.target.value)}
                />
              )}
            </Field>
            <div className="flex items-center justify-between gap-3 md:col-span-2">
              <span className="text-sm font-semibold">Print the shop name on basket labels</span>
              <Switch
                checked={draft.basket_label_show_shop_name}
                onCheckedChange={(v) => set('basket_label_show_shop_name', v)}
                aria-label="Print the shop name on basket labels"
              />
            </div>
          </div>

          <p className="mt-5 text-[13px] font-semibold">Ways to pay</p>
          <p className="mb-2 text-xs text-muted">
            A way that is off disappears from new payment forms; old payments still show normally.
            At least one must stay on.
          </p>
          <ul className="space-y-2">
            {Object.entries(draft.methods).map(([code, m]) => (
              <li
                key={code}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_120px_minmax(0,1fr)]"
              >
                <Switch
                  checked={m.is_active}
                  onCheckedChange={(v) =>
                    set('methods', { ...draft.methods, [code]: { ...m, is_active: v } })
                  }
                  aria-label={`${BASE_LABEL[code] ?? code} is on`}
                />
                <span className="text-sm font-semibold max-sm:hidden">
                  {BASE_LABEL[code] ?? code}
                </span>
                <Input
                  aria-label={`Name shown for ${BASE_LABEL[code] ?? code}`}
                  value={m.label}
                  maxLength={50}
                  onChange={(e) =>
                    set('methods', { ...draft.methods, [code]: { ...m, label: e.target.value } })
                  }
                />
              </li>
            ))}
            <li className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_120px_minmax(0,1fr)]">
              <Switch
                checked={draft.pay_at_pickup_enabled}
                onCheckedChange={(v) => set('pay_at_pickup_enabled', v)}
                aria-label="Pay at pickup is on"
              />
              <span className="text-sm font-semibold">Pay at pickup</span>
              <span className="text-xs text-muted max-sm:col-span-2">
                No payment is recorded at drop-off.
              </span>
            </li>
          </ul>
          {field('methods') && (
            <p className="mt-2 text-[13px] font-medium text-danger">{field('methods')}</p>
          )}
        </Card>

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-2 border-t border-line bg-foam/95 px-1 py-3 backdrop-blur max-md:bottom-16">
          <Button
            loading={save.isPending}
            needsNetwork
            disabled={!dirty || Boolean(brand?.blocking)}
            onClick={onSave}
          >
            Save changes
          </Button>
          <Button
            variant="secondary"
            disabled={!dirty}
            onClick={() => {
              setDraft(saved);
              setErrors({});
            }}
          >
            Discard changes
          </Button>
          <Button
            variant="ghost"
            className="ml-auto"
            icon={<RotateCcw className="size-4" aria-hidden="true" />}
            needsNetwork
            onClick={() => setResetting(true)}
          >
            Reset to LaundryFlow defaults
          </Button>
        </div>
        <ConfirmDialog
          open={resetting}
          onOpenChange={setResetting}
          title="Reset to the LaundryFlow defaults?"
          description="The name, logo, icon, colors, labels, basket prefix and payment options go back to how they were at the start. Orders, payments and customers are not touched."
          confirmLabel="Reset branding"
          variant="danger"
          loading={reset.isPending}
          onConfirm={() =>
            reset.mutate(undefined, {
              onSuccess: () => {
                toast.success('Branding reset');
                setResetting(false);
              },
              onError: (error) => toast.error(errorMessage(error)),
            })
          }
        />
      </div>

      <aside className="min-w-0 xl:sticky xl:top-6">
        <Card className="p-4">
          <CardHeader title="Live preview" className="mb-3" />
          <BrandPreview
            colors={colors}
            systemName={draft.system_name}
            tagline={draft.tagline}
            loginMessage={draft.login_message}
            logoUrl={loaded.logo_url}
            logoDarkUrl={loaded.logo_dark_url}
          />
        </Card>
      </aside>
    </div>
  );
}
