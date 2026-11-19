import { Download, Lightbulb, Printer, SlidersHorizontal } from 'lucide-react';
import { lazy, Suspense, useState, type ReactNode } from 'react';
import { csvHeader, csvValue } from '@/components/charts/format';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { FilterChips, type FilterChip } from '@/components/ui/FilterChips';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/States';
import { useAnalyticsReport } from '@/features/analytics/api';
import { KpiTile } from '@/features/analytics/components/KpiTile';
import { RangeFilter } from '@/features/analytics/components/RangeFilter';
import {
  DEFAULT_PRESET,
  useRangeParams,
  type RangeState,
} from '@/features/analytics/useRangeParams';
import { useCurrentUser } from '@/features/auth/store';
import { useBarangays } from '@/features/customers/api';
import { useInventoryItems } from '@/features/inventory/api';
import { useServices, useShopSettings, useUsers } from '@/features/settings/api';
import type { ReportKind, ReportResponse } from '@/lib/analytics/build';
import { formatRange, rangeLength } from '@/lib/analytics/time';
import type { ReportTable } from '@/lib/analytics/types';
import { cn } from '@/lib/cn';
import { downloadCsv } from '@/lib/csv';
import { formatDateLong, formatTime } from '@/lib/dates';
import { printAs } from '@/lib/print';
import { STATUS_META, STATUS_ORDER } from '@/lib/status';
import { DataTable, cellText } from '../components/DataTable';
import {
  FILTER_LABELS,
  REPORTS,
  reportMeta,
  type ReportFilterKey,
  type ReportMeta,
} from '../reportMeta';

// Recharts is the heaviest dependency: the KPIs and table show first, the charts right after.
const Charts = {
  sales: lazy(() => import('../components/ReportCharts').then((m) => ({ default: m.SalesCharts }))),
  orders: lazy(() =>
    import('../components/ReportCharts').then((m) => ({ default: m.OrdersCharts })),
  ),
  payments: lazy(() =>
    import('../components/ReportCharts').then((m) => ({ default: m.PaymentsCharts })),
  ),
  services: lazy(() =>
    import('../components/ReportCharts').then((m) => ({ default: m.ServicesCharts })),
  ),
  customers: lazy(() =>
    import('../components/ReportCharts').then((m) => ({ default: m.CustomersCharts })),
  ),
  inventory: lazy(() =>
    import('../components/ReportCharts').then((m) => ({ default: m.InventoryCharts })),
  ),
  staff: lazy(() => import('../components/ReportCharts').then((m) => ({ default: m.StaffCharts }))),
};

const FILTER_KEYS: ReportFilterKey[] = ['service', 'method', 'status', 'staff', 'barangay', 'item'];

interface Option {
  value: string;
  label: string;
}

/** The choices for each filter, from the same lists the rest of the app uses. */
function useFilterOptions(): Record<ReportFilterKey, Option[]> {
  const services = useServices();
  const users = useUsers();
  const barangays = useBarangays();
  const items = useInventoryItems();
  return {
    service: (services.data ?? []).map((s) => ({ value: String(s.id), label: s.name })),
    method: [
      { value: 'cash', label: 'Cash' },
      { value: 'gcash', label: 'GCash' },
      { value: 'maya', label: 'Maya' },
    ],
    status: STATUS_ORDER.map((code) => ({ value: code, label: STATUS_META[code].label })),
    staff: (users.data ?? []).map((u) => ({ value: String(u.id), label: u.name })),
    barangay: (barangays.data ?? []).map((b) => ({ value: b.name, label: b.name })),
    item: (items.data ?? []).map((i) => ({ value: String(i.id), label: i.name })),
  };
}

function ReportPicker({
  current,
  onPick,
}: {
  current: ReportMeta;
  onPick: (kind: ReportKind) => void;
}) {
  return (
    <>
      {/* Phones: tabs that scroll inside their own strip. */}
      <div
        role="tablist"
        aria-label="Reports"
        className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden print:hidden"
      >
        {REPORTS.map((report) => (
          <button
            key={report.kind}
            type="button"
            role="tab"
            aria-selected={report.kind === current.kind}
            onClick={() => onPick(report.kind)}
            className={cn(
              'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap',
              report.kind === current.kind
                ? 'border-ink bg-ink text-on-ink'
                : 'border-line-strong bg-surface',
            )}
          >
            <report.icon className="size-4" aria-hidden="true" />
            {report.name}
          </button>
        ))}
      </div>
      {/* Larger screens: a row of cards. */}
      <div
        role="tablist"
        aria-label="Reports"
        className="mb-5 hidden gap-3 md:grid md:grid-cols-4 xl:grid-cols-7 print:hidden"
      >
        {REPORTS.map((report) => {
          const active = report.kind === current.kind;
          return (
            <button
              key={report.kind}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onPick(report.kind)}
              className={cn(
                'flex min-h-11 flex-col items-start gap-1 rounded-card border p-3 text-left transition-colors',
                active
                  ? 'border-flow bg-flow-soft ring-1 ring-flow'
                  : 'border-line bg-surface hover:border-flow-line',
              )}
            >
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-control',
                  active ? 'bg-flow text-white' : 'bg-foam-2 text-flow',
                )}
              >
                <report.icon className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold">{report.name}</span>
              <span className="text-xs leading-snug text-muted">{report.description}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function FilterSelects({
  meta,
  options,
  filters,
  onChange,
  stacked,
}: {
  meta: ReportMeta;
  options: Record<ReportFilterKey, Option[]>;
  filters: Partial<Record<ReportFilterKey, string>>;
  onChange: (key: ReportFilterKey, value: string | null) => void;
  stacked?: boolean;
}) {
  return (
    <>
      {meta.filters.map((key) => (
        <div key={key} className={stacked ? 'w-full' : 'w-44'}>
          <Select
            aria-label={FILTER_LABELS[key]}
            value={filters[key] ?? 'all'}
            onValueChange={(value) => onChange(key, value === 'all' ? null : value)}
            options={[
              {
                value: 'all',
                label: key === 'item' ? 'All items' : `All: ${FILTER_LABELS[key].toLowerCase()}`,
              },
              ...options[key],
            ]}
          />
        </div>
      ))}
    </>
  );
}

/** Shown only on paper: who printed what, for which period, with which filters. */
function PrintHeader({
  meta,
  response,
  filterText,
}: {
  meta: ReportMeta;
  response?: ReportResponse;
  filterText: string;
}) {
  const user = useCurrentUser();
  const shop = useShopSettings();
  const now = new Date();
  return (
    <div className="mb-5 hidden border-b-2 border-ink pb-3 print:block">
      <div className="flex items-center gap-3">
        <Logo className="size-10" />
        <div>
          <p className="text-lg font-extrabold">{shop.data?.name ?? 'LaundryFlow'}</p>
          <p className="text-xs text-muted">{shop.data?.address}</p>
        </div>
      </div>
      <h1 className="mt-3 text-2xl font-extrabold">{meta.name} report</h1>
      {response && (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-xs">
          <dt className="text-muted">Period</dt>
          <dd>{formatRange(response.range)}</dd>
          <dt className="text-muted">Compared with</dt>
          <dd>{response.compare_range ? formatRange(response.compare_range) : 'No comparison'}</dd>
          <dt className="text-muted">Filters</dt>
          <dd>{filterText || 'None'}</dd>
          <dt className="text-muted">Generated</dt>
          <dd>
            By {user.name} on {formatDateLong(now)}, {formatTime(now)}
          </dd>
        </dl>
      )}
    </div>
  );
}

function exportTable(meta: ReportMeta, table: ReportTable, range: { from: string; to: string }) {
  const numeric = (format: string) => !['text', 'date', 'datetime', 'order'].includes(format);
  const rows = table.rows.map((row) =>
    table.columns.map((c) =>
      numeric(c.format)
        ? csvValue(row[c.key] as number | null, c.format as Parameters<typeof csvValue>[1])
        : cellText(row[c.key], c.format),
    ),
  );
  const totals = table.totals
    ? [
        table.columns.map((c) => {
          const value = table.totals?.[c.key];
          if (value === undefined || value === null) return '';
          return typeof value === 'string' || !numeric(c.format)
            ? String(value)
            : csvValue(value, c.format as Parameters<typeof csvValue>[1]);
        }),
      ]
    : [];
  downloadCsv(`laundryflow-${meta.kind}-report-${range.from}-to-${range.to}.csv`, [
    table.columns.map((c) =>
      numeric(c.format) ? csvHeader(c.label, c.format as Parameters<typeof csvHeader>[1]) : c.label,
    ),
    ...rows,
    ...totals,
  ]);
}

function Section({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section aria-label={label} className="mb-6">
      {children}
    </section>
  );
}

export default function ReportsPage() {
  const rangeState: RangeState = useRangeParams();
  const { params, setParam, range, compare } = rangeState;
  const meta = reportMeta(params.get('report'));
  const options = useFilterOptions();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filters: Partial<Record<ReportFilterKey, string>> = Object.fromEntries(
    meta.filters.flatMap((key) => (params.get(key) ? [[key, params.get(key) as string]] : [])),
  );
  const query = useAnalyticsReport(meta.kind, range, compare, filters);
  const data = query.data;
  const ChartSet = Charts[meta.kind] as (props: {
    query: typeof query;
    itemId?: number;
  }) => ReactNode;

  const labelOf = (key: ReportFilterKey, value: string) =>
    options[key].find((o) => o.value === value)?.label ?? value;
  const chips: FilterChip[] = [
    ...(rangeState.preset !== DEFAULT_PRESET
      ? [
          {
            key: 'range',
            label: formatRange(range),
            onRemove: () => setParam({ range: null, from: null, to: null }),
          },
        ]
      : []),
    ...meta.filters
      .filter((key) => filters[key])
      .map((key) => ({
        key,
        label: `${FILTER_LABELS[key]}: ${labelOf(key, filters[key] as string)}`,
        onRemove: () => setParam({ [key]: null }),
      })),
  ];
  const reset = () =>
    setParam({
      range: null,
      from: null,
      to: null,
      compare: null,
      ...Object.fromEntries(FILTER_KEYS.map((k) => [k, null])),
    });
  const pick = (kind: ReportKind) =>
    setParam({
      report: kind === 'sales' ? null : kind,
      ...Object.fromEntries(FILTER_KEYS.map((k) => [k, null])),
    });
  const filterText = meta.filters
    .filter((key) => filters[key])
    .map((key) => `${FILTER_LABELS[key]}: ${labelOf(key, filters[key] as string)}`)
    .join(' · ');

  return (
    <div className="report-root">
      <PageHeader
        title="Reports"
        documentTitle={`${meta.name} report`}
        subtitle={
          <span className="print:hidden">
            Figures come from recorded orders, payments and stock movements.
          </span>
        }
        className="print:hidden"
        actions={
          <>
            <Button
              variant="secondary"
              title="Downloads a CSV file that opens in Excel"
              icon={<Download className="size-4" aria-hidden="true" />}
              disabled={!data?.table}
              onClick={() => data?.table && exportTable(meta, data.table, data.range)}
            >
              Export CSV / Excel
            </Button>
            <Button
              icon={<Printer className="size-4" aria-hidden="true" />}
              onClick={() => printAs('report')}
            >
              Print / Save as PDF
            </Button>
          </>
        }
      />
      <PrintHeader meta={meta} response={data} filterText={filterText} />

      <ReportPicker current={meta} onPick={pick} />

      {/* Filters: sticky beside the sidebar on large screens, a sheet on phones. */}
      <div
        id="filters"
        className="mb-5 rounded-card border border-line bg-foam/95 p-3 backdrop-blur lg:sticky lg:top-0 lg:z-20 print:hidden"
      >
        <div className="hidden flex-wrap items-center gap-x-3 gap-y-2 md:flex">
          <RangeFilter state={rangeState} />
          <FilterSelects
            meta={meta}
            options={options}
            filters={filters}
            onChange={(key, value) => setParam({ [key]: value })}
          />
        </div>
        <div className="flex items-center justify-between gap-2 md:hidden">
          <p className="min-w-0 text-sm">
            <span className="font-semibold">{formatRange(range)}</span>
            {compare && (
              <span className="block text-xs text-muted">Compared with the previous period</span>
            )}
          </p>
          <Button
            variant="secondary"
            icon={<SlidersHorizontal className="size-4" aria-hidden="true" />}
            onClick={() => setSheetOpen(true)}
          >
            Filters{chips.length ? ` (${chips.length})` : ''}
          </Button>
        </div>
        <FilterChips chips={chips} onReset={reset} className="mt-2 empty:hidden" />
      </div>
      <Dialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Filters"
        description={`${meta.name} report`}
        footer={<Button onClick={() => setSheetOpen(false)}>Show results</Button>}
      >
        <div className="space-y-4">
          <RangeFilter state={rangeState} />
          <FilterSelects
            meta={meta}
            options={options}
            filters={filters}
            onChange={(key, value) => setParam({ [key]: value })}
            stacked
          />
          {chips.length > 0 && (
            <Button variant="ghost" onClick={reset} className="w-full">
              Reset all filters
            </Button>
          )}
        </div>
      </Dialog>

      <Section label="Summary">
        {data ? (
          <div
            className={cn(
              'grid grid-cols-2 gap-3 md:gap-4',
              data.kpis.length === 3
                ? 'lg:grid-cols-3'
                : data.kpis.length === 5
                  ? 'lg:grid-cols-5'
                  : data.kpis.length === 6
                    ? 'lg:grid-cols-3 xl:grid-cols-6'
                    : 'lg:grid-cols-4',
            )}
          >
            {data.kpis.map((kpi) => (
              <div key={kpi.key} className="flex min-w-0 [&>*]:flex-1">
                <KpiTile kpi={kpi} days={rangeLength(data.range)} compare={compare} />
              </div>
            ))}
          </div>
        ) : (
          <div
            role="status"
            aria-label="Loading figures"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {[0, 1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-36 rounded-card" />
            ))}
          </div>
        )}
      </Section>

      {data && data.insights.length > 0 && (
        <Card className="report-insights mb-6 border-flow-line bg-flow-soft p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-[17px] font-bold">
            <Lightbulb className="size-5 text-flow" aria-hidden="true" />
            Key insights
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] marker:text-flow">
            {data.insights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      )}

      <section aria-label="Charts" className="mb-6 grid gap-6 lg:grid-cols-12">
        <Suspense fallback={<Skeleton className="h-96 rounded-card lg:col-span-12" />}>
          <ChartSet query={query} itemId={filters.item ? Number(filters.item) : undefined} />
        </Suspense>
      </section>

      {data?.table ? (
        <DataTable
          key={`${meta.kind}-${data.range.from}-${data.range.to}`}
          title={meta.tableTitle}
          table={data.table}
        />
      ) : (
        <Skeleton className="h-80 rounded-card" />
      )}
    </div>
  );
}
