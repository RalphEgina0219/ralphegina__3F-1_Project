import { cn } from '@/lib/cn';

const TINTS = [
  'bg-status-washing-bg text-status-washing-fg',
  'bg-status-folding-bg text-status-folding-fg',
  'bg-status-drying-bg text-status-drying-fg',
  'bg-status-ready-bg text-status-ready-fg',
  'bg-status-received-bg text-status-received-fg',
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

interface AvatarProps {
  name: string;
  className?: string;
  /** Solid brand fill for the selected or primary person. */
  solid?: boolean;
}

export function Avatar({ name, className, solid }: AvatarProps) {
  const tint = TINTS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TINTS.length];
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
        className?.includes('bg-') ? undefined : solid ? 'bg-flow text-white' : tint,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
