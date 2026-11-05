import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatSmartTime } from '@/lib/dates';
import { STATUS_META, STATUS_ORDER, statusIndex } from '@/lib/status';
import type { TimelineStepDto } from '@/types/api';
import type { StatusCode } from '@/types/entities';

/** The 6-step progress bar. Status is also given as text, never by color alone. */
export function StatusProgress({ status, className }: { status: StatusCode; className?: string }) {
  const current = statusIndex(status);
  const done = status === 'released';
  return (
    <div
      role="progressbar"
      aria-label="Laundry progress"
      aria-valuemin={1}
      aria-valuemax={STATUS_ORDER.length}
      aria-valuenow={current + 1}
      aria-valuetext={`Stage ${current + 1} of ${STATUS_ORDER.length}: ${STATUS_META[status].label}`}
      className={cn('grid grid-cols-6 gap-1.5', className)}
    >
      {STATUS_ORDER.map((step, index) => (
        <span
          key={step}
          className={cn(
            'h-2 rounded-full',
            index < current || done
              ? 'bg-flow'
              : index === current
                ? STATUS_META[step].dot
                : 'bg-foam-2',
          )}
        />
      ))}
    </div>
  );
}

/** Stage, date and time for each step the order reached. For customers: no staff names. */
export function StatusTimeline({
  status,
  timeline,
}: {
  status: StatusCode;
  timeline: readonly TimelineStepDto[];
}) {
  const current = statusIndex(status);
  const completed = status === 'released';
  return (
    <ol className="space-y-3">
      {timeline.map((step, index) => {
        const isCurrent = index === current && !completed;
        const done = index < current || completed;
        return (
          <li
            key={step.status}
            aria-current={isCurrent ? 'step' : undefined}
            className="flex items-center gap-3"
          >
            {done ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-flow text-white">
                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
              </span>
            ) : isCurrent ? (
              <span
                className={cn(
                  'size-7 shrink-0 rounded-full ring-4 ring-flow-soft',
                  STATUS_META[step.status].dot,
                )}
              />
            ) : (
              <span className="size-7 shrink-0 rounded-full border-2 border-line-strong bg-surface" />
            )}
            <span
              className={cn(
                'min-w-0 flex-1',
                done && 'font-semibold',
                isCurrent && ['font-bold', STATUS_META[step.status].fg].join(' '),
                !done && !isCurrent && 'text-muted',
              )}
            >
              {step.label}
              {isCurrent && <span className="sr-only"> (current stage)</span>}
            </span>
            {step.at && (
              <span className="shrink-0 text-right text-[13px] text-muted">
                {formatSmartTime(step.at)}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
