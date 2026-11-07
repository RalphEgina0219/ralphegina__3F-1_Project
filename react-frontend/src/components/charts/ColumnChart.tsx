import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ValueFormat } from '@/lib/analytics/types';
import { AXIS_TICK, BAR_GAP, BAR_RADIUS, GRID, MAX_BAR_SIZE, UI } from './chartTheme';
import { TooltipBox, type TooltipRow } from './ChartTooltip';
import { formatAxis, formatValue } from './format';
import { useChartAnimation } from './motion';

export interface ColumnSeries {
  key: string;
  label: string;
  color: string;
}

export interface ColumnDatum {
  key: string;
  /** Axis label, short: "Nov 7", "8 AM". */
  label: string;
  /** Tooltip heading, long: "Sat, Nov 7", "8–9 AM". */
  title: string;
  values: Record<string, number>;
  /** Overrides the series colour for this column (aging alerts). */
  color?: string;
  note?: string;
}

interface ColumnChartProps {
  data: ColumnDatum[];
  series: ColumnSeries[];
  format: ValueFormat;
  /** This column stands out; the others are drawn lighter (the current hour). */
  highlightKey?: string | null;
  /** Label the tallest column's value. */
  labelMax?: boolean;
  onSelect?: (key: string) => void;
  selectHint?: string;
}

/**
 * Vertical columns, single or stacked: rounded at the top, square at the baseline, a 2 px gap
 * between segments, at most 40 px wide. Grid lines are horizontal only.
 */
export default function ColumnChart({
  data,
  series,
  format,
  highlightKey,
  labelMax = false,
  onSelect,
  selectHint,
}: ColumnChartProps) {
  const animation = useChartAnimation();
  const stacked = series.length > 1;
  const rows = data.map((d) => ({ ...d, ...d.values }));
  const totals = data.map((d) => Object.values(d.values).reduce((s, v) => s + v, 0));
  const maxIndex = totals.indexOf(Math.max(...totals));

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={0}
      initialDimension={{ width: 320, height: 240 }}
    >
      <BarChart data={rows} margin={{ top: 20, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
        <CartesianGrid {...GRID} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: UI.line }}
          minTickGap={12}
          interval="preserveStartEnd"
          height={26}
        />
        <YAxis
          width={44}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickCount={4}
          allowDecimals={false}
          tickFormatter={(value: number) => formatAxis(value, format)}
        />
        <Tooltip
          cursor={{ fill: UI.foam }}
          isAnimationActive={false}
          content={({ active, payload }) => {
            const datum = payload?.[0]?.payload as ColumnDatum | undefined;
            if (!active || !datum) return null;
            const lines: TooltipRow[] = series.map((s) => ({
              label: s.label,
              value: formatValue(datum.values[s.key] ?? 0, format),
              color: datum.color ?? s.color,
            }));
            if (stacked) {
              lines.push({
                label: 'Total',
                value: formatValue(
                  Object.values(datum.values).reduce((s, v) => s + v, 0),
                  format,
                ),
                strong: true,
              });
            }
            const note = [datum.note, onSelect ? (selectHint ?? 'Click to see these orders') : '']
              .filter(Boolean)
              .join(' · ');
            if (note && lines[lines.length - 1])
              lines[lines.length - 1] = { ...(lines[lines.length - 1] as TooltipRow), note };
            return <TooltipBox title={datum.title} rows={lines} />;
          }}
        />
        {series.map((s, index) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={stacked ? 'stack' : undefined}
            fill={s.color}
            maxBarSize={MAX_BAR_SIZE}
            radius={!stacked || index === series.length - 1 ? [BAR_RADIUS, BAR_RADIUS, 0, 0] : 0}
            stroke={stacked ? UI.surface : undefined}
            strokeWidth={stacked ? BAR_GAP : 0}
            cursor={onSelect ? 'pointer' : undefined}
            onClick={
              onSelect ? (entry) => onSelect(String((entry.payload as ColumnDatum).key)) : undefined
            }
            {...animation}
          >
            {data.map((d) => (
              <Cell
                key={d.key}
                fill={d.color ?? s.color}
                fillOpacity={highlightKey && d.key !== highlightKey ? 0.4 : 1}
              />
            ))}
            {labelMax && index === series.length - 1 && totals[maxIndex] ? (
              <LabelList
                dataKey={s.key}
                content={(props) =>
                  props.index === maxIndex ? (
                    <text
                      x={Number(props.x) + Number(props.width) / 2}
                      y={Number(props.y) - 6}
                      textAnchor="middle"
                      fill={UI.text}
                      fontSize={12}
                      fontWeight={700}
                      className="tabular"
                    >
                      {formatValue(totals[maxIndex] as number, format)}
                    </text>
                  ) : null
                }
              />
            ) : null}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
