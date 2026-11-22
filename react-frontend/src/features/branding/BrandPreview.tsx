import { Droplets } from 'lucide-react';
import type { CSSProperties } from 'react';
import { brandTokens, type BrandColors, type Mode } from '@/lib/color';
import { STATUS_META } from '@/lib/status';

interface PreviewProps {
  colors: BrandColors;
  systemName: string;
  tagline: string;
  loginMessage: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
}

/** One mini screen in one mode: sidebar, button, status chip, card and the login header. */
function Mini({
  mode,
  colors,
  systemName,
  tagline,
  loginMessage,
  logoUrl,
  logoDarkUrl,
}: PreviewProps & { mode: Mode }) {
  // The mode's tokens are scoped to this box (index.css [data-preview-theme]) and the brand's on top.
  const style = brandTokens(colors, mode) as CSSProperties;
  const logo = mode === 'dark' ? (logoDarkUrl ?? logoUrl) : logoUrl;
  const chip = !(mode === 'dark' && logoDarkUrl);
  return (
    <div
      data-preview-theme={mode}
      data-testid={`brand-preview-${mode}`}
      style={style}
      className="overflow-hidden rounded-card border border-line-strong bg-foam text-text"
    >
      <p className="px-3 pt-2 text-[11px] font-bold tracking-wide text-muted uppercase">
        {mode === 'dark' ? 'Dark mode' : 'Light mode'}
      </p>
      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2 p-2">
        <div className="rounded-control bg-ink p-2 text-on-ink">
          <div className="flex items-center gap-1.5">
            {logo ? (
              <span
                className={
                  chip
                    ? 'flex size-6 items-center justify-center rounded bg-white p-0.5'
                    : 'flex size-6 items-center justify-center'
                }
              >
                <img src={logo} alt="" className="size-full object-contain" />
              </span>
            ) : (
              <span className="flex size-6 items-center justify-center rounded bg-ink-2">
                <Droplets className="size-4 text-aqua" aria-hidden="true" />
              </span>
            )}
            <span className="truncate text-[11px] font-extrabold">{systemName || 'Your shop'}</span>
          </div>
          <p className="mt-2 rounded bg-ink-3 px-1.5 py-1 text-[10px] font-semibold">Dashboard</p>
          <p className="mt-1 px-1.5 py-1 text-[10px] text-on-ink-muted">Orders</p>
        </div>
        <div className="min-w-0 space-y-2">
          <div className="rounded-control border border-line bg-surface p-2">
            <p className="truncate text-[12px] font-bold">Order LF-261121-0001</p>
            <p className="text-[11px] text-muted">Maria Santos · 6.5 kg</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_META.washing.chip}`}
              >
                {STATUS_META.washing.label}
              </span>
              <span className="text-[11px] font-semibold text-flow-text underline">Open</span>
            </div>
          </div>
          <span className="inline-flex min-h-8 items-center rounded-control bg-flow px-3 text-[12px] font-semibold text-on-flow">
            Save order
          </span>
        </div>
      </div>
      <div className="mx-2 mb-2 rounded-control bg-ink px-3 py-2 text-on-ink">
        <p className="text-[12px] font-extrabold">{systemName || 'Your shop'}</p>
        <p className="text-[11px] text-on-ink-muted">
          {loginMessage || tagline || 'Every load, tracked from drop-off to pickup.'}
        </p>
      </div>
    </div>
  );
}

/** The live preview: light and dark side by side, updated as the owner edits. */
export function BrandPreview(props: PreviewProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1" data-testid="brand-preview">
      <Mini mode="light" {...props} />
      <Mini mode="dark" {...props} />
    </div>
  );
}
