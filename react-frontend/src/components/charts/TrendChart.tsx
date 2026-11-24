import {
  Area,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { deltaPct } from '@/lib/analytics/series';
import { formatDayLong, formatDayShort } from '@/lib/analytics/time';
import type { ValueFormat } from '@/lib/analytics/types';
import {
  ACTIVE_DOT,
  AREA_FILL_OPACITY,
  AXIS_TICK,
  GRID,
  LINE,
  PREVIOUS_LINE,
  REFERENCE_LINE,
  UI,
} from './chartTheme';
import { TooltipBox, type TooltipRow } from './ChartTooltip';
import { formatAxis, formatValue } from './format';
import { useChartAnimation } from './motion';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  /** Area fill under the line (the main measure); plain line otherwise. */
  area?: boolean;
  /** A dashed line, for values that are predicted rather than recorded. */
  dashed?: boolean;
}

export type TrendDatum = { date: string } & Record<string, string | number | null | undefined>;

interface TrendChartProps {
  /** One row per day: the date and a number per series key. */
  data: readonly { date: string }[];
  series: TrendSeries[];
  format: ValueFormat;
  /** Key of the comparison values, drawn as a dashed muted line. */
  previousKey?: string;
  /** A target to read against, such as the 24-hour promise. */
  reference?: { value: number; label: string };
  /** Label the latest value at the end of the main line. */
  labelLast?: boolean;
  /** A vertical line at one day, such as where the history ends and the forecast begins. */
  marker?: { date: string; label: string };
}

/**
 * Lines and areas over days: 2 px lines with round joins, no dots until hovered, a crosshair, a
 * light area fill, and the previous period as a dashed muted line. One y-axis only.
 */
export default function TrendChart({
  data,
  series,
  format,
  previousKey,
  reference,
  labelLast = true,
  marker,
}: TrendChartProps) {
  const animation = useChartAnimation();
  const main = series[0];
  const lastIndex = data.length - 1;

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={0}
      initialDimension={{ width: 320, height: 240 }}
    >
      <ComposedChart
        data={data as TrendDatum[]}
        margin={{ top: 20, right: 12, bottom: 0, left: 0 }}
      >
        <CartesianGrid {...GRID} />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => formatDayShort(value)}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: UI.line }}
          minTickGap={28}
          interval="preserveStartEnd"
          height={26}
        />
        <YAxis
          width={52}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickCount={4}
          allowDecimals={format !== 'count'}
          domain={[0, 'auto']}
          tickFormatter={(value: number) => formatAxis(value, format)}
        />
        <Tooltip
          cursor={{ stroke: UI.lineStrong, strokeWidth: 1 }}
          isAnimationActive={false}
          content={({ active, payload }) => {
            const datum = payload?.[0]?.payload as TrendDatum | undefined;
            if (!active || !datum) return null;
            const rows: TooltipRow[] = series.map((s) => ({
              label: s.label,
              value: formatValue(datum[s.key] as number | null, format),
              color: s.color,
              strong: s === main,
            }));
            if (previousKey && main) {
              const current = datum[main.key] as number | null;
              const before = datum[previousKey] as number | null;
              const change = deltaPct(current, before);
              rows.push({
                label: 'Previous period',
                value: formatValue(before, format),
                color: UI.muted,
                dashed: true,
                note:
                  change === null
                    ? undefined
                    : `${change >= 0 ? '+' : '−'}${Math.abs(change).toFixed(1)}% vs previous period`,
              });
            }
            if (reference)
              rows.push({ label: reference.label, value: formatValue(reference.value, format) });
            return <TooltipBox title={formatDayLong(datum.date)} rows={rows} />;
          }}
        />
        {reference && (
          <ReferenceLine y={reference.value} {...REFERENCE_LINE} ifOverflow="extendDomain" />
        )}
        {marker && (
          <ReferenceLine
            x={marker.date}
            {...REFERENCE_LINE}
            label={{ value: marker.label, position: 'insideTopLeft', fill: UI.muted, fontSize: 12 }}
          />
        )}
        {previousKey && (
          <Line
            dataKey={previousKey}
            name="Previous period"
            type="monotone"
            dot={false}
            activeDot={{ r: 4, stroke: UI.surface, strokeWidth: 2, fill: UI.muted }}
            connectNulls={false}
            {...PREVIOUS_LINE}
            {...animation}
          />
        )}
        {series.map((s) =>
          s.area ? (
            <Area
              key={s.key}
              dataKey={s.key}
              name={s.label}
              type="monotone"
              stroke={s.color}
              fill={s.color}
              fillOpacity={AREA_FILL_OPACITY}
              {...LINE}
              dot={false}
              activeDot={{ ...ACTIVE_DOT, fill: s.color }}
              connectNulls={false}
              {...animation}
            >
              {labelLast && s === main && (
                <LabelList
                  dataKey={s.key}
                  content={(props) => lastLabel(props, lastIndex, format)}
                />
              )}
            </Area>
          ) : (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.label}
              type="monotone"
              stroke={s.color}
              {...LINE}
              strokeDasharray={s.dashed ? PREVIOUS_LINE.strokeDasharray : undefined}
              dot={false}
              activeDot={{ ...ACTIVE_DOT, fill: s.color }}
              connectNulls={false}
              {...animation}
            >
              {labelLast && s === main && (
                <LabelList
                  dataKey={s.key}
                  content={(props) => lastLabel(props, lastIndex, format)}
                />
              )}
            </Line>
          ),
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** The one direct label: the latest value, in text colour, just above the last point. */
function lastLabel(
  props: { x?: number | string; y?: number | string; value?: unknown; index?: number },
  lastIndex: number,
  format: ValueFormat,
) {
  if (props.index !== lastIndex || props.value === null || props.value === undefined) return null;
  return (
    <text
      x={Number(props.x)}
      y={Number(props.y) - 10}
      textAnchor="end"
      fill={UI.text}
      fontSize={12}
      fontWeight={700}
      className="tabular"
    >
      {formatValue(Number(props.value), format)}
    </text>
  );
}
