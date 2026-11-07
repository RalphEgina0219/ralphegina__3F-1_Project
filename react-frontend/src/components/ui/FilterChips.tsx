import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/** Active filters as removable chips, with "Reset" when there is more than one. */
export function FilterChips({
  chips,
  onReset,
  className,
}: {
  chips: FilterChip[];
  onReset?: () => void;
  className?: string;
}) {
  if (chips.length === 0) return null;
  return (
    <ul aria-label="Active filters" className={cn('flex flex-wrap items-center gap-2', className)}>
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove filter: ${chip.label}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-flow-line bg-flow-soft px-3 text-[13px] font-semibold text-flow hover:bg-flow-line/40"
          >
            {chip.label}
            <X className="size-4" aria-hidden="true" />
          </button>
        </li>
      ))}
      {onReset && chips.length > 1 && (
        <li>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-11 items-center px-2 text-[13px] font-semibold text-muted underline underline-offset-2 hover:text-text"
          >
            Reset
          </button>
        </li>
      )}
    </ul>
  );
}
