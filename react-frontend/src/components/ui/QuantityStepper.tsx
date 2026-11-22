import { Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Decimal places allowed: 1 for kilograms, 0 for pieces. */
  decimals?: number;
  unit?: string;
  label: string;
  id?: string;
  className?: string;
  'aria-invalid'?: true;
}

export function QuantityStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  decimals = 0,
  unit,
  label,
  id,
  className,
  ...aria
}: QuantityStepperProps) {
  const [draft, setDraft] = useState(value.toFixed(decimals));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(value.toFixed(decimals));
  }, [value, decimals, editing]);

  const commit = (next: number) => {
    const factor = 10 ** decimals;
    onChange(Math.min(max, Math.max(min, Math.round(next * factor) / factor)));
  };

  const stepButtonClass =
    'flex size-11 shrink-0 items-center justify-center bg-foam text-flow-text hover:bg-flow-soft focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:text-muted';

  return (
    <div
      className={cn(
        'inline-flex h-11 items-stretch overflow-hidden rounded-control bg-surface outline outline-line-strong -outline-offset-1',
        className,
      )}
    >
      <button
        type="button"
        className={stepButtonClass}
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => commit(value - step)}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="flex min-w-0 flex-1 items-center justify-center gap-1 px-1">
        <input
          id={id}
          type="text"
          inputMode={decimals > 0 ? 'decimal' : 'numeric'}
          aria-label={label}
          value={draft}
          onFocus={(event) => {
            setEditing(true);
            event.target.select();
          }}
          onChange={(event) => {
            const text = event.target.value;
            setDraft(text);
            const parsed = Number(text);
            if (text !== '' && Number.isFinite(parsed)) commit(parsed);
          }}
          onBlur={() => setEditing(false)}
          className="h-full w-full min-w-0 bg-transparent text-right font-semibold tabular-nums focus-visible:-outline-offset-2"
          {...aria}
        />
        {unit && <span className="text-sm font-semibold whitespace-nowrap">{unit}</span>}
      </span>
      <button
        type="button"
        className={stepButtonClass}
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => commit(value + step)}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
