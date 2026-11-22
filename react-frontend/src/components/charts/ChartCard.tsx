import { BarChart3, Download, Image as ImageIcon, MoreHorizontal, Table2 } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Table, type Column } from '@/components/ui/Table';
import type { ValueFormat } from '@/lib/analytics/types';
import { cn } from '@/lib/cn';
import { downloadCsv } from '@/lib/csv';
import { PLOT_HEIGHT_CLASS } from './chartTheme';
import { Delta } from './Delta';
import { downloadChartPng } from './exportChart';
import { csvHeader, csvValue, formatValue } from './format';

export interface ChartTableColumn {
  key: string;
  label: string;
  format?: ValueFormat | 'text';
}

/** The chart's data as rows: the "View as table" view and the CSV download. */
export interface ChartTableData {
  columns: ChartTableColumn[];
  rows: Record<string, string | number | null>[];
  /** Makes the first cell of a row a link, for drill-down without a pointer. */
  href?: (row: Record<string, string | number | null>) => string | undefined;
}

export interface LegendItem {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
  /** Amount and share beside the name, for the donut. */
  detail?: string;
  /** An icon instead of the swatch: alerts carry an icon, never colour alone. */
  icon?: ReactNode;
}

export type ChartStatus = 'pending' | 'error' | 'empty' | 'ready';
export type SkeletonShape = 'line' | 'columns' | 'bars' | 'donut' | 'heatmap';

interface ChartCardProps {
  title: string;
  /** What is measured and over what period. */
  subtitle: string;
  headline?: ReactNode;
  delta?: { pct: number | null; days: number; inverse?: boolean };
  legend?: LegendItem[];
  status: ChartStatus;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  /** Where "change the range" goes; defaults to the filter bar on this page. */
  emptyHref?: string;
  skeleton: SkeletonShape;
  /** The chart's accessible name, generated from the data. */
  summary: string;
  table: ChartTableData;
  filename: string;
  source?: string;
  className?: string;
  /** Overrides the fixed plot height. */
  plotClassName?: string;
  children: ReactNode;
}

/** Bars, lines, a ring or a grid of cells in the shape of the chart that is loading. */
function ChartSkeleton({ shape }: { shape: SkeletonShape }) {
  if (shape === 'donut') {
    return (
      <div className="flex h-full items-center justify-center" aria-hidden="true">
        <div className="size-40 animate-pulse rounded-full border-[22px] border-foam-2" />
      </div>
    );
  }
  if (shape === 'heatmap') {
    return (
      <div className="grid h-full grid-cols-12 grid-rows-7 gap-1 pl-10" aria-hidden="true">
        {Array.from({ length: 84 }, (_, i) => (
          <Skeleton key={i} className="rounded-sm" />
        ))}
      </div>
    );
  }
  if (shape === 'bars') {
    return (
      <div className="flex h-full flex-col justify-center gap-3" aria-hidden="true">
        {[70, 52, 40, 26, 14].map((width) => (
          <div key={width} className="flex items-center gap-3">
            <Skeleton className="h-3 w-20" />
            <div className="h-6 animate-pulse rounded-r bg-foam-2" style={{ width: `${width}%` }} />
          </div>
        ))}
      </div>
    );
  }
  const heights = shape === 'columns' ? [40, 62, 35, 80, 55, 70, 45, 90, 60, 50, 75, 38] : null;
  return (
    <div className="flex h-full items-end gap-1.5 border-b border-line pb-1" aria-hidden="true">
      {(heights ?? [30, 42, 38, 55, 50, 62, 58, 70, 66, 78, 72, 85]).map((h, i) => (
        <div
          key={i}
          className={cn('flex-1 animate-pulse bg-foam-2', heights ? 'rounded-t' : 'rounded-full')}
          style={{ height: heights ? `${h}%` : '6px', marginBottom: heights ? 0 : `${h * 0.9}%` }}
        />
      ))}
    </div>
  );
}

/**
 * The frame of every chart: title and period, optional headline with its change, legend above
 * the plot, a fixed-height plot, the source note, a table view and downloads. Loading, empty and
 * error states keep the same footprint so the page doesn't jump.
 */
export function ChartCard({
  title,
  subtitle,
  headline,
  delta,
  legend,
  status,
  error,
  onRetry,
  emptyTitle = 'No orders in this period',
  emptyHref = '#filters',
  skeleton,
  summary,
  table,
  filename,
  source = 'From recorded orders and payments',
  className,
  plotClassName,
  children,
}: ChartCardProps) {
  const [asTable, setAsTable] = useState(false);
  const plotRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const summaryId = useId();
  const ready = status === 'ready';

  // Touch: a tap outside the chart closes its tooltip, as a tap inside opens it.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const plot = plotRef.current;
      if (!plot || event.pointerType === 'mouse' || plot.contains(event.target as Node)) return;
      plot
        .querySelectorAll('.recharts-wrapper')
        .forEach((wrapper) =>
          wrapper.dispatchEvent(
            new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }),
          ),
        );
      plot.dispatchEvent(new CustomEvent('chartdismiss'));
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const downloadCsvFile = () =>
    downloadCsv(`${filename}.csv`, [
      table.columns.map((c) =>
        c.format && c.format !== 'text' ? csvHeader(c.label, c.format) : c.label,
      ),
      ...table.rows.map((row) =>
        table.columns.map((c) =>
          c.format && c.format !== 'text'
            ? csvValue(row[c.key] as number | null, c.format)
            : (row[c.key] ?? ''),
        ),
      ),
    ]);

  const columns: Column<Record<string, string | number | null>>[] = table.columns.map(
    (c, index) => ({
      key: c.key,
      header: c.label,
      align: c.format && c.format !== 'text' ? 'right' : 'left',
      card: index === 0 ? 'title' : undefined,
      className: c.format && c.format !== 'text' ? 'tabular' : undefined,
      cell: (row) => {
        const raw = row[c.key];
        const text =
          c.format && c.format !== 'text'
            ? formatValue(raw as number | null, c.format)
            : String(raw ?? '');
        const href = index === 0 ? table.href?.(row) : undefined;
        return href ? (
          <Link to={href} className="font-semibold text-flow-text underline underline-offset-2">
            {text}
          </Link>
        ) : (
          text
        );
      },
    }),
  );

  return (
    <Card
      role="region"
      aria-labelledby={headingId}
      className={cn('chart-card avoid-break flex min-w-0 flex-col p-4 md:p-5', className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id={headingId} className="text-[17px] font-bold">
            {title}
          </h2>
          <p className="text-[13px] text-muted">{subtitle}</p>
        </div>
        <div className="-mt-1.5 -mr-2 flex shrink-0 items-center print:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={asTable}
            aria-label={asTable ? 'View as chart' : 'View as table'}
            title={asTable ? 'View as chart' : 'View as table'}
            disabled={!ready}
            onClick={() => setAsTable((v) => !v)}
          >
            {asTable ? (
              <BarChart3 className="size-5" aria-hidden="true" />
            ) : (
              <Table2 className="size-5" aria-hidden="true" />
            )}
          </Button>
          <Dropdown>
            <DropdownTrigger
              aria-label={`More options for ${title}`}
              disabled={!ready}
              className="flex size-11 items-center justify-center rounded-control text-text hover:bg-foam-2 disabled:opacity-50"
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem
                icon={<Download className="size-4" aria-hidden="true" />}
                onSelect={downloadCsvFile}
              >
                Download CSV
              </DropdownItem>
              <DropdownItem
                icon={<ImageIcon className="size-4" aria-hidden="true" />}
                disabled={asTable}
                onSelect={() => {
                  if (plotRef.current)
                    void downloadChartPng(plotRef.current, `${filename}.png`, title);
                }}
              >
                Download PNG
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>

      {ready && (headline !== undefined || delta) && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {headline !== undefined && (
            <span className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] tabular">
              {headline}
            </span>
          )}
          {delta && <Delta pct={delta.pct} days={delta.days} inverse={delta.inverse} />}
        </div>
      )}

      {ready && legend && legend.length > 0 && !asTable && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legend">
          {legend.map((item) => (
            <li key={item.key} className="flex min-w-0 items-center gap-1.5 text-[13px] text-text">
              {item.icon ? (
                <span className="flex shrink-0" style={{ color: item.color }} aria-hidden="true">
                  {item.icon}
                </span>
              ) : item.dashed ? (
                <svg width="16" height="10" aria-hidden="true" className="shrink-0">
                  <line
                    x1="0"
                    y1="5"
                    x2="16"
                    y2="5"
                    stroke={item.color}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                </svg>
              ) : (
                <span
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ background: item.color }}
                  aria-hidden="true"
                />
              )}
              <span>{item.label}</span>
              {item.detail && <span className="text-muted tabular">{item.detail}</span>}
            </li>
          ))}
        </ul>
      )}

      <div
        ref={plotRef}
        data-chart-plot=""
        role="group"
        aria-label={ready ? summary : `${title}: loading`}
        aria-describedby={ready ? summaryId : undefined}
        className={cn(
          'relative mt-3 min-w-0',
          asTable && ready ? 'max-h-[360px] overflow-y-auto' : (plotClassName ?? PLOT_HEIGHT_CLASS),
        )}
      >
        {status === 'pending' && (
          <div role="status" aria-label={`Loading ${title}`} className="h-full">
            <ChartSkeleton shape={skeleton} />
          </div>
        )}
        {status === 'error' && (
          <div className="flex h-full items-center justify-center">
            <ErrorState error={error} onRetry={onRetry} />
          </div>
        )}
        {status === 'empty' && (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={BarChart3}
              title={emptyTitle}
              description="Try a longer date range."
              action={
                <a
                  href={emptyHref}
                  className="font-semibold text-flow-text underline underline-offset-2"
                >
                  Change the date range
                </a>
              }
              className="py-4"
            />
          </div>
        )}
        {ready &&
          (asTable ? (
            <Table
              columns={columns}
              rows={table.rows.map((row, index) => ({ ...row, __row: index }))}
              rowKey={(row) => Number(row.__row)}
              caption={title}
              dense
            />
          ) : (
            <div className="chart-plot h-full">{children}</div>
          ))}
        {ready && (
          <p id={summaryId} className="sr-only">
            {summary}
          </p>
        )}
      </div>

      <p className="mt-3 text-xs text-muted">{source}</p>
    </Card>
  );
}

/** Loading, error, empty or ready, from a query and whether its data has anything to draw. */
export function chartStatus(
  query: { isPending: boolean; isError: boolean; data?: unknown },
  isEmpty: boolean,
): ChartStatus {
  if (query.isPending && !query.data) return 'pending';
  if (query.isError && !query.data) return 'error';
  return isEmpty ? 'empty' : 'ready';
}
