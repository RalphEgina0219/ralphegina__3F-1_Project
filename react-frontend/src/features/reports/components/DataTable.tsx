import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Columns3, Search } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router-dom';
import { formatValue } from '@/components/charts/format';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/States';
import { formatDayShort } from '@/lib/analytics/time';
import type { Cell, ColumnFormat, ReportColumn, ReportTable } from '@/lib/analytics/types';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/dates';

const PAGE_SIZES = [25, 50, 100] as const;
const NUMERIC: ReadonlySet<ColumnFormat> = new Set([
  'money',
  'count',
  'kg',
  'hours',
  'percent',
  'number',
]);

/** A cell as text: money in whole pesos, dates as "Nov 7", order numbers as they are. */
export function cellText(value: Cell | undefined, format: ColumnFormat): string {
  if (value === null || value === undefined || value === '') return NUMERIC.has(format) ? '—' : '';
  if (NUMERIC.has(format))
    return formatValue(Number(value), format as Parameters<typeof formatValue>[1]);
  if (format === 'date')
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value))
      ? formatDayShort(String(value))
      : (formatDateTime(String(value)).split(',')[0] ?? '');
  if (format === 'datetime') return formatDateTime(String(value));
  return String(value);
}

function renderCell(row: Record<string, Cell>, column: ReportColumn): ReactNode {
  const text = cellText(row[column.key], column.format);
  if (column.format === 'order' && row.id) {
    return (
      <Link
        to={`/orders/${row.id}`}
        className="inline-flex min-h-11 items-center font-mono text-[13px] font-semibold text-flow underline underline-offset-2"
      >
        {text}
      </Link>
    );
  }
  return text;
}

type Sort = { key: string; direction: 'asc' | 'desc' } | null;

/**
 * True while the browser prepares to print. The full, unpaginated table is only built then: a
 * hidden copy of hundreds of rows would otherwise sit in the page all the time.
 */
function usePrinting() {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    // flushSync: the rows must be in the DOM before the browser lays out the printout.
    const start = () => flushSync(() => setPrinting(true));
    const stop = () => setPrinting(false);
    const media = window.matchMedia('print');
    const onChange = (event: MediaQueryListEvent) => (event.matches ? start() : stop());
    window.addEventListener('beforeprint', start);
    window.addEventListener('afterprint', stop);
    media.addEventListener('change', onChange);
    return () => {
      window.removeEventListener('beforeprint', start);
      window.removeEventListener('afterprint', stop);
      media.removeEventListener('change', onChange);
    };
  }, []);
  return printing;
}

function compare(a: Cell | undefined, b: Cell | undefined) {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'en', { numeric: true });
}

interface DataTableProps {
  title: string;
  table: ReportTable;
}

/**
 * The detailed table under every report: sortable columns, a sticky header, right-aligned
 * tabular numbers, a totals row, search, 25/50/100 rows a page, optional columns, and cards
 * below md. Printing shows every row, without pagination.
 */
export function DataTable({ title, table }: DataTableProps) {
  const printing = usePrinting();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>(null);
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState(1);
  const [shown, setShown] = useState<Set<string>>(
    () => new Set(table.columns.filter((c) => !c.optional).map((c) => c.key)),
  );
  const optional = table.columns.filter((c) => c.optional);
  const columns = table.columns.filter((c) => shown.has(c.key));

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const matched = needle
      ? table.rows.filter((row) =>
          table.columns.some((c) => cellText(row[c.key], c.format).toLowerCase().includes(needle)),
        )
      : table.rows;
    if (!sort) return matched;
    const sorted = [...matched].sort((a, b) => compare(a[sort.key], b[sort.key]));
    return sort.direction === 'desc' ? sorted.reverse() : sorted;
  }, [table, search, sort]);

  const last = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, last);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: string) => {
    setPage(1);
    setSort((s) =>
      s?.key !== key
        ? { key, direction: 'asc' }
        : s.direction === 'asc'
          ? { key, direction: 'desc' }
          : null,
    );
  };

  const header = (column: ReportColumn, sortable: boolean) => {
    const numeric = NUMERIC.has(column.format);
    const active = sort?.key === column.key;
    const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th
        key={column.key}
        scope="col"
        aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
        className={cn(
          'sticky top-0 z-10 border-b border-line bg-surface px-3 py-1 text-[13px] font-semibold whitespace-nowrap text-muted first:pl-4 last:pr-4 print:static',
          numeric ? 'text-right' : 'text-left',
        )}
      >
        {sortable ? (
          <button
            type="button"
            onClick={() => toggleSort(column.key)}
            className={cn(
              'inline-flex min-h-11 items-center gap-1 hover:text-text',
              numeric && 'flex-row-reverse',
              active && 'text-text',
            )}
          >
            {column.label}
            <Icon className="size-3.5 print:hidden" aria-hidden="true" />
          </button>
        ) : (
          column.label
        )}
      </th>
    );
  };

  const totals = table.totals;
  const tableMarkup = (bodyRows: Record<string, Cell>[], sortable: boolean) => (
    <table className="w-full text-sm">
      <caption className="sr-only">{title}</caption>
      <thead>
        <tr>{columns.map((c) => header(c, sortable))}</tr>
      </thead>
      <tbody>
        {bodyRows.map((row, index) => (
          <tr
            key={index}
            className="border-b border-line last:border-b-0 hover:bg-foam/60 print:break-inside-avoid"
          >
            {columns.map((c) => (
              <td
                key={c.key}
                className={cn(
                  'px-3 py-2 align-middle first:pl-4 last:pr-4',
                  NUMERIC.has(c.format) ? 'text-right tabular whitespace-nowrap' : 'text-left',
                )}
              >
                {renderCell(row, c)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {totals && (
        <tfoot>
          <tr className="border-t-2 border-line-strong bg-foam font-bold">
            {columns.map((c, index) => (
              <td
                key={c.key}
                className={cn(
                  'px-3 py-2.5 first:pl-4 last:pr-4',
                  NUMERIC.has(c.format) ? 'text-right tabular whitespace-nowrap' : 'text-left',
                )}
              >
                {totals[c.key] !== undefined && totals[c.key] !== null
                  ? typeof totals[c.key] === 'string'
                    ? totals[c.key]
                    : cellText(totals[c.key], c.format)
                  : index === 0
                    ? 'Total'
                    : ''}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  );

  return (
    <Card className="report-table min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 pb-3 md:p-5 md:pb-3 print:hidden">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <p className="text-[13px] text-muted" aria-live="polite">
            {rows.length} {rows.length === 1 ? 'row' : 'rows'}
            {search.trim() ? ` matching “${search.trim()}”` : ''}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="min-w-0 flex-1 sm:w-56 sm:flex-none">
            <Input
              type="search"
              aria-label={`Search ${title.toLowerCase()}`}
              placeholder="Search this table"
              icon={<Search className="size-4" aria-hidden="true" />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          {optional.length > 0 && (
            <RadixDropdown.Root>
              <RadixDropdown.Trigger className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold hover:bg-foam">
                <Columns3 className="size-4" aria-hidden="true" />
                Columns
              </RadixDropdown.Trigger>
              <RadixDropdown.Portal>
                <RadixDropdown.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 min-w-52 rounded-control border border-line bg-surface p-1 shadow-lg"
                >
                  <RadixDropdown.Label className="px-3 py-1.5 text-xs font-semibold text-muted">
                    Optional columns
                  </RadixDropdown.Label>
                  {optional.map((c) => (
                    <RadixDropdown.CheckboxItem
                      key={c.key}
                      checked={shown.has(c.key)}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(checked) =>
                        setShown((current) => {
                          const next = new Set(current);
                          if (checked) next.add(c.key);
                          else next.delete(c.key);
                          return next;
                        })
                      }
                      className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium outline-none select-none data-highlighted:bg-flow-soft"
                    >
                      <span className="flex size-4 items-center justify-center rounded border border-line-strong">
                        <RadixDropdown.ItemIndicator>
                          <Check className="size-3.5 text-flow" aria-hidden="true" />
                        </RadixDropdown.ItemIndicator>
                      </span>
                      {c.label}
                    </RadixDropdown.CheckboxItem>
                  ))}
                </RadixDropdown.Content>
              </RadixDropdown.Portal>
            </RadixDropdown.Root>
          )}
        </div>
      </div>
      <h2 className="hidden px-1 pb-2 text-[15px] font-bold print:block">{title}</h2>

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          description="Try another search or a wider date range."
          className="print:hidden"
        />
      ) : (
        <>
          {/* Screen, md and up: sticky header in its own scroll box. */}
          <div className="relative hidden max-h-[640px] overflow-auto md:block print:hidden">
            {tableMarkup(visible, true)}
          </div>
          {/* Phones: one card per row. */}
          <ul
            aria-label={title}
            className="divide-y divide-line border-t border-line md:hidden print:hidden"
          >
            {visible.map((row, index) => {
              const [first, ...rest] = columns;
              return (
                <li key={index} className="p-4">
                  {first && <p className="font-semibold">{renderCell(row, first)}</p>}
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                    {rest.map((c) => (
                      <div key={c.key} className="min-w-0">
                        <dt className="text-xs text-muted">{c.label}</dt>
                        <dd
                          className={cn(
                            'min-w-0 wrap-break-word',
                            NUMERIC.has(c.format) && 'tabular',
                          )}
                        >
                          {renderCell(row, c)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              );
            })}
            {totals && (
              <li className="bg-foam p-4">
                <p className="font-bold">Total</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                  {columns
                    .slice(1)
                    .filter((c) => totals[c.key] !== undefined && totals[c.key] !== null)
                    .map((c) => (
                      <div key={c.key}>
                        <dt className="text-xs text-muted">{c.label}</dt>
                        <dd className="font-bold tabular">
                          {typeof totals[c.key] === 'string'
                            ? totals[c.key]
                            : cellText(totals[c.key], c.format)}
                        </dd>
                      </div>
                    ))}
                </dl>
              </li>
            )}
          </ul>
          {/* Print: every row; the header repeats on each page. */}
          {printing && <div className="hidden print:block">{tableMarkup(rows, false)}</div>}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line print:hidden">
            <Pagination
              meta={{
                current_page: current,
                per_page: pageSize,
                total: rows.length,
                last_page: last,
              }}
              onPageChange={setPage}
              className="flex-1"
            />
            <div className="flex items-center gap-2 px-4 pb-3 sm:pb-0">
              <span id="rows-per-page" className="text-[13px] text-muted">
                Rows per page
              </span>
              <div className="w-24">
                <Select
                  aria-label="Rows per page"
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                  options={PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
