import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Replaces `cell` in the phone card, for example to add a checkbox beside the title. */
  cardCell?: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  /** Role in the phone card: `title` first, `badge` top-right, `actions` full width at the bottom. */
  card?: 'title' | 'subtitle' | 'badge' | 'field' | 'actions' | 'hidden';
  /** Label in the phone card when `header` is not plain text. */
  cardLabel?: string;
}

interface TableProps<T> {
  columns: readonly Column<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string | number;
  /** Visually hidden description of the table. */
  caption: string;
  isSelected?: (row: T) => boolean;
  rowClass?: (row: T) => string | undefined;
  minWidth?: string;
  /** Tighter cell padding for tables beside a side panel. */
  dense?: boolean;
  className?: string;
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

/**
 * The same data as a real table from md up and as stacked cards below md. Wide tables scroll in
 * their own box so the page itself never scrolls sideways.
 */
export function Table<T>({
  columns,
  rows,
  rowKey,
  caption,
  isSelected,
  rowClass,
  minWidth = '100%',
  dense,
  className,
}: TableProps<T>) {
  const byRole = (role: Column<T>['card']) => columns.filter((column) => column.card === role);
  const fields = columns.filter((column) => !column.card || column.card === 'field');
  const render = (column: Column<T>, row: T) => (column.cardCell ?? column.cell)(row);
  const padding = dense ? 'px-2' : 'px-3';

  return (
    <div className={className}>
      {/* `relative` keeps sr-only header text inside this scroll box instead of widening the page. */}
      <div className="relative hidden overflow-x-auto md:block print:block">
        <table className="w-full text-sm" style={{ minWidth }}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    padding,
                    'py-2.5 text-[13px] font-semibold whitespace-nowrap text-muted first:pl-4 last:pr-4',
                    ALIGN[column.align ?? 'left'],
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  'border-b border-line last:border-b-0',
                  isSelected?.(row) && 'bg-flow-soft',
                  rowClass?.(row),
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      padding,
                      'py-2.5 align-middle first:pl-4 last:pr-4',
                      ALIGN[column.align ?? 'left'],
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul aria-label={caption} className="divide-y divide-line md:hidden print:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className={cn('p-4', isSelected?.(row) && 'bg-flow-soft')}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 font-semibold">
                {byRole('title').map((column) => (
                  <div key={column.key} className="min-w-0">
                    {render(column, row)}
                  </div>
                ))}
                {byRole('subtitle').map((column) => (
                  <div key={column.key} className="min-w-0 text-[13px] font-normal text-muted">
                    {render(column, row)}
                  </div>
                ))}
              </div>
              {byRole('badge').map((column) => (
                <div key={column.key} className="shrink-0">
                  {render(column, row)}
                </div>
              ))}
            </div>
            {fields.length > 0 && (
              <dl
                className={cn(
                  'mt-2.5 grid gap-x-4 gap-y-2',
                  fields.length % 3 === 0 ? 'grid-cols-3' : 'grid-cols-2',
                )}
              >
                {fields.map((column) => (
                  <div key={column.key} className="min-w-0">
                    <dt className="text-xs text-muted">{column.cardLabel ?? column.header}</dt>
                    <dd className="min-w-0 wrap-break-word">{render(column, row)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {byRole('actions').map((column) => (
              <div key={column.key} className="mt-3 flex flex-col gap-2 *:w-full">
                {render(column, row)}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
