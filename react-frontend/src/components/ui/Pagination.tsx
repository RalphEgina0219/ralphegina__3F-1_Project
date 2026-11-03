import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PageMeta } from '@/types/api';
import { Button } from './Button';

/** 1 … 4 5 6 … 12 */
function pageWindow(current: number, last: number): (number | 'gap')[] {
  const pages = new Set([1, last, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const output: (number | 'gap')[] = [];
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && page - previous > 1) output.push('gap');
    output.push(page);
  });
  return output;
}

export function Pagination({
  meta,
  onPageChange,
  className,
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const { current_page: page, per_page: perPage, total, last_page: last } = meta;
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 px-4 py-3', className)}>
      <p className="text-[13px] text-muted" aria-live="polite">
        Showing {first}–{end} of {total}
      </p>
      {last > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          {pageWindow(page, last).map((item, index) =>
            item === 'gap' ? (
              <span
                key={`gap-${index}`}
                className="hidden px-1 text-muted xs:inline"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                type="button"
                key={item}
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
                className={cn(
                  'size-11 rounded-control border text-sm font-semibold',
                  item === page
                    ? 'border-ink bg-ink text-on-ink'
                    : 'hidden border-line-strong bg-surface hover:bg-foam xs:block',
                )}
              >
                {item}
              </button>
            ),
          )}
          <Button
            variant="secondary"
            size="icon"
            aria-label="Next page"
            disabled={page >= last}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  );
}
