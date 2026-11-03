import { Check, Waves } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface StepItem {
  key: string;
  label: string;
  /** Timestamp or hint below the label. */
  detail?: string | null;
  state: 'done' | 'current' | 'upcoming';
}

function StepDot({
  step,
  index,
  size = 'md',
}: {
  step: StepItem;
  index: number;
  size?: 'md' | 'sm';
}) {
  const box = size === 'md' ? 'size-9' : 'size-7';
  if (step.state === 'done') {
    return (
      <span className={cn(box, 'flex items-center justify-center rounded-full bg-flow text-white')}>
        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }
  if (step.state === 'current') {
    return (
      <span
        className={cn(
          box,
          'flex items-center justify-center rounded-full bg-status-washing-dot text-white ring-4 ring-status-washing-bg',
        )}
      >
        <Waves className="size-4" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        box,
        'flex items-center justify-center rounded-full border-2 border-line-strong bg-surface text-xs font-semibold text-muted',
      )}
    >
      {index + 1}
    </span>
  );
}

/** Horizontal from md up, and a vertical timeline on phones. Step names are always shown as text. */
export function Stepper({ steps, label }: { steps: readonly StepItem[]; label: string }) {
  return (
    <>
      <ol aria-label={label} className="hidden md:flex">
        {steps.map((step, index) => (
          <li
            key={step.key}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className="relative flex min-w-0 flex-1 flex-col items-center px-1 text-center"
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-4 right-1/2 left-[-50%] h-1',
                  step.state === 'upcoming' ? 'bg-foam-2' : 'bg-flow',
                )}
              />
            )}
            <span className="relative z-10">
              <StepDot step={step} index={index} />
            </span>
            <span
              className={cn(
                'mt-2 text-[13px]',
                step.state === 'upcoming' ? 'text-muted' : 'font-semibold text-text',
                step.state === 'current' && 'text-status-washing-fg',
              )}
            >
              {step.label}
            </span>
            {step.detail && <span className="mt-0.5 text-xs text-muted">{step.detail}</span>}
          </li>
        ))}
      </ol>
      <ol aria-label={label} className="md:hidden">
        {steps.map((step, index) => (
          <li
            key={step.key}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className="relative flex gap-3 pb-3 last:pb-0"
          >
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-7 bottom-0 left-3.25 w-0.5',
                  step.state === 'done' ? 'bg-flow' : 'bg-line-strong',
                )}
              />
            )}
            <span className="relative">
              <StepDot step={step} index={index} size="sm" />
            </span>
            <span className="min-w-0 pt-0.5">
              <span
                className={cn(
                  'block font-semibold',
                  step.state === 'upcoming' ? 'text-muted' : 'text-text',
                )}
              >
                {step.label}
              </span>
              {step.detail && <span className="block text-[13px] text-muted">{step.detail}</span>}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
