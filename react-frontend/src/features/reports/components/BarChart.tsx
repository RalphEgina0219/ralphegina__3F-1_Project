import {
  Bar,
  BarChart as RechartsBarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface BarSeries {
  key: string;
  label: string;
  /** A CSS color token. */
  color: string;
}

export interface BarDatum {
  label: string;
  /** Full label in the tooltip, for example "Sat, Oct 31". */
  title: string;
  [key: string]: string | number;
}

interface BarChartProps {
  data: readonly BarDatum[];
  series: readonly BarSeries[];
  formatValue: (value: number) => string;
  /** Single series only: this bar stands out, the rest stay light. */
  highlightIndex?: number;
  height?: number;
  ariaLabel: string;
}

const AXIS_COLOR = 'var(--color-muted)';
const LIGHT_BAR = 'var(--color-flow-line)';

interface TipProps {
  active?: boolean;
  label?: string | number;
  payload?: readonly { dataKey?: unknown; value?: unknown; payload?: BarDatum }[];
  series: readonly BarSeries[];
  formatValue: (value: number) => string;
}

function ChartTooltip({ active, payload, series, formatValue }: TipProps) {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload;
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 text-[13px] shadow-md">
      <p className="font-bold">{datum?.title}</p>
      {series.map((s) => (
        <p key={s.key} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted">
            {series.length > 1 && (
              <span
                className="size-2.5 rounded-sm"
                style={{ background: s.color }}
                aria-hidden="true"
              />
            )}
            {s.label}
          </span>
          <span className="font-semibold">{formatValue(Number(datum?.[s.key] ?? 0))}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * One axis, thin rounded bars and a recessive baseline. Values are read from the hover tooltip and
 * from the data table that always sits beside the chart on the page.
 */
export default function BarChart({
  data,
  series,
  formatValue,
  highlightIndex,
  height = 220,
  ariaLabel,
}: BarChartProps) {
  const stacked = series.length > 1;
  const tickEvery = data.length > 16 ? Math.ceil(data.length / 8) - 1 : 0;

  return (
    <div role="img" aria-label={ariaLabel} style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 320, height }}
      >
        <RechartsBarChart
          data={data as BarDatum[]}
          margin={{ top: 6, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={data.length > 16 ? '18%' : '12%'}
        >
          <XAxis
            dataKey="label"
            axisLine={{ stroke: 'var(--color-line)' }}
            tickLine={false}
            interval={tickEvery}
            tick={{ fontSize: 12, fill: AXIS_COLOR }}
            height={26}
          />
          <YAxis hide domain={[0, 'dataMax']} />
          <Tooltip
            cursor={{ fill: 'var(--color-foam)' }}
            isAnimationActive={false}
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={props.payload as TipProps['payload']}
                series={series}
                formatValue={formatValue}
              />
            )}
          />
          {series.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId={stacked ? 'total' : undefined}
              fill={s.color}
              isAnimationActive={false}
              radius={!stacked || index === series.length - 1 ? [4, 4, 0, 0] : 0}
              // A 2 px surface gap between stacked segments.
              stroke={stacked ? 'var(--color-surface)' : undefined}
              strokeWidth={stacked ? 2 : 0}
            >
              {!stacked &&
                data.map((datum, cellIndex) => (
                  <Cell
                    key={datum.label + cellIndex}
                    fill={
                      highlightIndex === undefined || cellIndex === highlightIndex
                        ? s.color
                        : LIGHT_BAR
                    }
                  />
                ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
