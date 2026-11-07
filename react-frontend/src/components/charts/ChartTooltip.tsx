import { cn } from '@/lib/cn';

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
  dashed?: boolean;
  /** A smaller line under the value, such as the change vs the previous period. */
  note?: string;
  strong?: boolean;
}

/** The one tooltip look: label or date on top, then each value with its swatch. */
export function TooltipBox({
  title,
  rows,
  className,
}: {
  title: string;
  rows: TooltipRow[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none min-w-36 rounded-control border border-line bg-surface px-3 py-2 text-[13px] shadow-md',
        className,
      )}
    >
      <p className="font-bold text-text">{title}</p>
      {rows.map((row) => (
        <div key={row.label} className="mt-0.5">
          <p className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              {row.color &&
                (row.dashed ? (
                  <svg width="12" height="8" aria-hidden="true">
                    <line
                      x1="0"
                      y1="4"
                      x2="12"
                      y2="4"
                      stroke={row.color}
                      strokeWidth="2"
                      strokeDasharray="3 2"
                    />
                  </svg>
                ) : (
                  <span
                    className="size-2.5 rounded-[3px]"
                    style={{ background: row.color }}
                    aria-hidden="true"
                  />
                ))}
              {row.label}
            </span>
            <span className={cn('tabular text-text', row.strong ? 'font-bold' : 'font-semibold')}>
              {row.value}
            </span>
          </p>
          {row.note && <p className="text-xs text-muted">{row.note}</p>}
        </div>
      ))}
    </div>
  );
}
