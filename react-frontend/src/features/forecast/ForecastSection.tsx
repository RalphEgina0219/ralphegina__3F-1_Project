import { BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChartCard, chartStatus } from '@/components/charts/ChartCard';
import { CATEGORICAL, UI } from '@/components/charts/chartTheme';
import { formatValue } from '@/components/charts/format';
import TrendChart from '@/components/charts/TrendChart';
import { Badge } from '@/components/ui/Badge';
import { linkClass } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useForecast } from '@/features/analytics/api';
import type { ForecastResponse, ForecastTarget } from '@/lib/analytics/forecast';
import { addDays, formatDayLong, formatDayShort } from '@/lib/analytics/time';
import { cn } from '@/lib/cn';
import { formatAmount } from '@/lib/wash';

/** History shown before the forecast: 4 weeks keeps the weekday rhythm readable. */
const HISTORY_SHOWN = 28;
const PREDICTED_COLOR = CATEGORICAL[1] as string;

type Query = ReturnType<typeof useForecast>;

const fmt = (value: number | null, target: ForecastTarget) => formatValue(value, target.format);
const signed = (value: number, target: ForecastTarget) =>
  `${value >= 0 ? '+' : '−'}${fmt(Math.abs(value), target)}`;

function forecastSummary(target: ForecastTarget, data: ForecastResponse): string {
  const future = target.points.filter((p) => p.actual === null);
  const peak = future.reduce((best, p) => (p.predicted > best.predicted ? p : best), future[0]!);
  return `${target.label} forecast: about ${fmt(target.forecast_total, target)} from ${formatDayShort(
    data.horizon.from,
  )} to ${formatDayShort(data.horizon.to)}; busiest on ${formatDayLong(peak.date)} (${fmt(
    peak.predicted,
    target,
  )}).`;
}

function TargetChart({
  query,
  targetKey: key,
}: {
  query: Query;
  targetKey: ForecastTarget['key'];
}) {
  const data = query.data;
  const target = data?.targets.find((t) => t.key === key);
  const title = key === 'orders' ? 'Orders forecast' : 'Kilos forecast';
  const shown = target ? target.points.slice(-(HISTORY_SHOWN + (data?.horizon.days ?? 7))) : [];

  return (
    <ChartCard
      className="md:col-span-1 lg:col-span-6"
      title={title}
      subtitle={
        data
          ? `Next 7 days, ${formatDayShort(data.horizon.from)} to ${formatDayShort(data.horizon.to)}`
          : 'Next 7 days'
      }
      headline={target ? `${fmt(target.forecast_total, target)} expected` : undefined}
      legend={[
        { key: 'actual', label: 'Recorded', color: UI.flow },
        { key: 'predicted', label: 'Model', color: PREDICTED_COLOR, dashed: true },
      ]}
      status={chartStatus(query, !target)}
      error={query.error}
      onRetry={() => void query.refetch()}
      emptyTitle="Not enough history yet"
      skeleton="line"
      summary={target && data ? forecastSummary(target, data) : ''}
      source="Ridge linear regression on recorded orders, retrained on every load"
      table={{
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'actual', label: 'Recorded', format: target?.format ?? 'count' },
          { key: 'predicted', label: 'Model', format: target?.format ?? 'count' },
          { key: 'low', label: 'Low (80%)', format: target?.format ?? 'count' },
          { key: 'high', label: 'High (80%)', format: target?.format ?? 'count' },
        ],
        rows: shown.map((p) => ({
          date: formatDayLong(p.date),
          actual: p.actual,
          predicted: p.predicted,
          low: p.low,
          high: p.high,
        })),
      }}
      filename={`${title.toLowerCase().replace(/\s+/g, '-')}-${data?.today ?? ''}`}
    >
      <TrendChart
        data={shown.map((p) => ({ date: p.date, actual: p.actual, predicted: p.predicted }))}
        series={[
          { key: 'actual', label: 'Recorded', color: UI.flow, area: true },
          { key: 'predicted', label: 'Model', color: PREDICTED_COLOR, dashed: true },
        ]}
        format={target?.format ?? 'count'}
        labelLast={false}
        marker={data ? { date: data.today, label: 'Today' } : undefined}
      />
    </ChartCard>
  );
}

/** The held-back week, in words: how far off the model was, next to the naive guess. */
function Accuracy({ target }: { target: ForecastTarget }) {
  const evaluation = target.evaluation;
  if (!evaluation) {
    return (
      <p className="text-sm text-muted">
        {target.label}: accuracy is measured once there are 3 weeks of history.
      </p>
    );
  }
  const better = evaluation.baseline_mae > 0 ? 1 - evaluation.mae / evaluation.baseline_mae : 0;
  const wins = evaluation.mae < evaluation.baseline_mae;
  const error = (value: number) =>
    target.format === 'count' ? `${formatValue(value, 'number')} orders` : formatValue(value, 'kg');
  return (
    <div className="text-sm">
      <p className="flex flex-wrap items-center gap-2 font-semibold">
        {target.label}
        <Badge tone={wins ? 'ok' : 'warn'}>
          {wins
            ? `${Math.round(better * 100)}% better than the simple guess`
            : 'Not beating the simple guess yet'}
        </Badge>
      </p>
      <p className="mt-0.5 text-muted tabular">
        Off by {error(evaluation.mae)} a day on average, against {error(evaluation.baseline_mae)}{' '}
        for &ldquo;same day last week&rdquo;
        {target.r2 !== null && (
          <> · explains {Math.round(target.r2 * 100)}% of the day-to-day swings</>
        )}
      </p>
    </div>
  );
}

function ModelCard({ data }: { data: ForecastResponse }) {
  const orders = data.targets.find((t) => t.key === 'orders')!;
  const kilos = data.targets.find((t) => t.key === 'kilos')!;
  const coefficient = (target: ForecastTarget, name: string) =>
    target.coefficients.find((c) => c.name === name)?.value ?? 0;
  const weekdays = ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <Card className="p-4 md:col-span-1 md:p-5 lg:col-span-6">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <BrainCircuit className="size-5 text-flow-text" aria-hidden="true" />
            How the forecast works
          </span>
        }
        subtitle={`Machine learning: ${data.model.algorithm.toLowerCase()}`}
      />
      <p className="mt-3 text-sm">
        The model studies the last {data.training.days} days of orders (
        {formatDayShort(data.training.from as string)} to {formatDayShort(data.training.to)}): how
        busy each weekday is and whether business is growing. It then projects the next 7 days. It
        retrains each time this page loads, so new orders count from tomorrow on.
      </p>

      <h3 className="mt-4 text-[15px] font-bold">How accurate it is</h3>
      <p className="text-[13px] text-muted">
        Tested on the last {data.model.holdout_days} days, which it did not see while learning
      </p>
      <div className="mt-2 grid gap-3">
        <Accuracy target={orders} />
        <Accuracy target={kilos} />
      </div>

      <details className="group mt-4">
        <summary
          className={cn(linkClass, 'inline-flex min-h-11 cursor-pointer items-center text-sm')}
        >
          What the model learned
        </summary>
        <div className="overflow-x-auto">
          <table className="mt-1 w-full text-sm tabular">
            <caption className="sr-only">Coefficients learned by the model</caption>
            <thead>
              <tr className="border-b border-line text-left text-[13px] text-muted">
                <th scope="col" className="py-1.5 pr-3 font-semibold">
                  Feature
                </th>
                <th scope="col" className="py-1.5 pr-3 text-right font-semibold">
                  Orders
                </th>
                <th scope="col" className="py-1.5 text-right font-semibold">
                  Kilos
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                  Monday (starting level)
                </th>
                <td className="py-1.5 pr-3 text-right">
                  {formatValue(coefficient(orders, 'intercept'), 'number')}
                </td>
                <td className="py-1.5 text-right">{fmt(coefficient(kilos, 'intercept'), kilos)}</td>
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                  Growth per week
                </th>
                <td className="py-1.5 pr-3 text-right">
                  {signedNumber(coefficient(orders, 'trend (per week)'))}
                </td>
                <td className="py-1.5 text-right">
                  {signed(coefficient(kilos, 'trend (per week)'), kilos)}
                </td>
              </tr>
              {weekdays.map((day) => (
                <tr key={day} className="border-b border-line last:border-0">
                  <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                    {day} vs Monday
                  </th>
                  <td className="py-1.5 pr-3 text-right">
                    {signedNumber(coefficient(orders, day))}
                  </td>
                  <td className="py-1.5 text-right">{signed(coefficient(kilos, day), kilos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[13px] text-muted">
          Prediction = starting level + growth × weeks + the weekday&rsquo;s extra. Ridge penalty λ
          = {data.model.lambda}; the band in the table is an {data.model.interval}.
        </p>
      </details>
    </Card>
  );
}

const signedNumber = (value: number) =>
  `${value >= 0 ? '+' : '−'}${formatValue(Math.abs(value), 'number')}`;

function SoapCard({ data }: { data: ForecastResponse }) {
  const short = data.soap.filter((s) => s.short_by > 0);
  return (
    <Card className="p-4 md:col-span-1 md:p-5 self-start lg:col-span-6">
      <CardHeader
        title="Soap for the next 7 days"
        subtitle="Recent soap use per kilo × the kilos forecast"
        action={
          <Link to="/inventory" className={cn(linkClass, 'text-sm')}>
            Open inventory
          </Link>
        }
      />
      {data.soap.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          No soap use recorded yet. Set soap per kilo in Settings, Pricing &amp; Usage.
        </p>
      ) : (
        <>
          {short.length > 0 && (
            <p className="mt-2 text-sm font-semibold text-warn">
              {short.length === 1 ? '1 item' : `${short.length} items`} will run out before the week
              is over.
            </p>
          )}
          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            {data.soap.map((s) => (
              <li
                key={s.item_id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line py-2"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-[13px] text-muted tabular">
                    Needs {s.needed_label} · {s.on_hand_label} on hand
                  </p>
                </div>
                {s.short_by > 0 ? (
                  <Badge tone="warn">Buy {formatAmount(s.unit, s.short_by)}</Badge>
                ) : (
                  <Badge tone="ok">Enough</Badge>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

/** The demand forecast row on the dashboard: two charts, how the model works, and soap. */
export default function ForecastSection() {
  const query = useForecast();
  const data = query.data;

  if (query.isError && !data) {
    return (
      <Card className="md:col-span-2 lg:col-span-12">
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Card>
    );
  }
  if (data && data.status !== 'ready') {
    const left = Math.max(0, data.training.min_days - data.training.days);
    return (
      <Card className="md:col-span-2 lg:col-span-12">
        <EmptyState
          icon={BrainCircuit}
          title="The forecast is still learning"
          description={`It needs ${data.training.min_days} days of orders to learn the shop's weekly rhythm; ${
            data.training.days
          } so far. Check back ${left === 1 ? 'tomorrow' : `in ${left} days`}, around ${formatDayShort(
            addDays(data.today, left),
          )}.`}
        />
      </Card>
    );
  }

  return (
    <>
      <TargetChart query={query} targetKey="orders" />
      <TargetChart query={query} targetKey="kilos" />
      {data ? (
        <>
          <ModelCard data={data} />
          <SoapCard data={data} />
        </>
      ) : (
        <Skeleton className="h-64 rounded-card md:col-span-2 lg:col-span-12" />
      )}
    </>
  );
}
