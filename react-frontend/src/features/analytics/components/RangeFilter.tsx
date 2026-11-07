import * as Popover from '@radix-ui/react-popover';
import { CalendarRange } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import {
  RANGE_PRESETS,
  formatRange,
  manilaDay,
  type DateRange,
  type RangePreset,
} from '@/lib/analytics/time';
import { cn } from '@/lib/cn';
import type { RangeState } from '../useRangeParams';

function CustomRange({
  range,
  onApply,
  active,
}: {
  range: DateRange;
  onApply: (r: DateRange) => void;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);
  const today = manilaDay(Date.now());
  const valid = draft.from && draft.to && draft.from <= draft.to && draft.to <= today;
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(range);
      }}
    >
      <Popover.Trigger
        className={cn(
          'inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-semibold',
          active ? 'bg-ink text-on-ink' : 'text-text hover:bg-foam-2',
        )}
        aria-pressed={active}
      >
        <CalendarRange className="size-4" aria-hidden="true" />
        Custom
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 w-72 rounded-card border border-line bg-surface p-4 shadow-lg data-[state=open]:animate-pop-in"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!valid) return;
              onApply(draft);
              setOpen(false);
            }}
            className="space-y-3"
          >
            <p className="text-sm font-bold">Custom range</p>
            <Field label="From">
              {(field) => (
                <Input
                  {...field}
                  type="date"
                  max={draft.to || today}
                  value={draft.from}
                  onChange={(event) => setDraft((d) => ({ ...d, from: event.target.value }))}
                />
              )}
            </Field>
            <Field label="To" error={draft.to > today ? 'Pick today or earlier.' : undefined}>
              {(field) => (
                <Input
                  {...field}
                  type="date"
                  min={draft.from}
                  max={today}
                  value={draft.to}
                  onChange={(event) => setDraft((d) => ({ ...d, to: event.target.value }))}
                />
              )}
            </Field>
            <Button type="submit" className="w-full" disabled={!valid}>
              Apply
            </Button>
          </form>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * The period every chart and KPI on the page follows: presets, a custom range and the
 * comparison switch. Phones get a select instead of the button row.
 */
export function RangeFilter({ state, className }: { state: RangeState; className?: string }) {
  const { preset, range, compare, setPreset, setCustom, setCompare } = state;
  return (
    <div
      id="filters"
      className={cn('flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2', className)}
    >
      <div className="w-full sm:hidden">
        <Select
          aria-label="Date range"
          value={preset}
          onValueChange={(value) => {
            if (value === 'custom') setCustom(range);
            else setPreset(value as Exclude<RangePreset, 'custom'>);
          }}
          options={[...RANGE_PRESETS, { value: 'custom', label: `Custom: ${formatRange(range)}` }]}
        />
      </div>
      <div
        role="group"
        aria-label="Date range"
        className="hidden flex-wrap items-center gap-0.5 rounded-control border border-line bg-surface p-0.5 sm:flex"
      >
        {RANGE_PRESETS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={preset === option.value}
            onClick={() => setPreset(option.value)}
            className={cn(
              'min-h-11 rounded-control px-3 text-sm font-semibold whitespace-nowrap',
              preset === option.value ? 'bg-ink text-on-ink' : 'text-text hover:bg-foam-2',
            )}
          >
            {option.label}
          </button>
        ))}
        <CustomRange range={range} onApply={setCustom} active={preset === 'custom'} />
      </div>
      <div className="inline-flex min-h-11 items-center gap-2">
        <Switch id="compare-previous" checked={compare} onCheckedChange={setCompare} />
        <label htmlFor="compare-previous" className="cursor-pointer text-sm font-medium">
          Compare to previous period
        </label>
      </div>
    </div>
  );
}
