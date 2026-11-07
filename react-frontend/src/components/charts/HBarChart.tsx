import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ValueFormat } from '@/lib/analytics/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AXIS_TICK, BAR_RADIUS, UI } from './chartTheme';
import { TooltipBox } from './ChartTooltip';
import { formatValue, shareLabel } from './format';
import { useChartAnimation } from './motion';

export interface HBarDatum {
  key: string;
  label: string;
  value: number;
  color: string;
  share?: number;
  /** The direct label at the end of the bar; defaults to the formatted value. */
  detail?: string;
  /** Extra tooltip lines. */
  notes?: string[];
}

interface HBarChartProps {
  data: HBarDatum[];
  format: ValueFormat;
  /** Drill-down: the bar's key. */
  onSelect?: (key: string) => void;
  /** Describes what a click does, for the tooltip. */
  selectHint?: string;
}

const CHAR_WIDTH = 7.4; // Plus Jakarta Sans at 12 px, wide letters included

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Horizontal bars for anything with a name (services, stages, barangays): names read on the
 * left at any width. Square at the baseline, rounded at the data end, a direct label at the end.
 */
export default function HBarChart({ data, format, onSelect, selectHint }: HBarChartProps) {
  const animation = useChartAnimation();
  const phone = useMediaQuery('(max-width: 767px)');
  const maxChars = phone ? 14 : 22;
  const longest = Math.max(4, ...data.map((d) => Math.min(maxChars, d.label.length)));
  const labelWidth = Math.round(longest * CHAR_WIDTH) + 14;
  const detailOf = (d: HBarDatum) => d.detail ?? formatValue(d.value, format);
  const valueWidth =
    Math.round(Math.max(...data.map((d) => detailOf(d).length), 3) * CHAR_WIDTH) + 16;

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={0}
      initialDimension={{ width: 320, height: 240 }}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: valueWidth, bottom: 0, left: 0 }}
        barCategoryGap="22%"
      >
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis
          type="category"
          dataKey="label"
          width={labelWidth}
          // One line, truncated: Recharts would otherwise wrap long names onto two.
          tick={({
            x,
            y,
            payload,
          }: {
            x: number | string;
            y: number | string;
            payload: { value: string };
          }) => (
            <text
              x={Number(x) - 6}
              y={Number(y)}
              textAnchor="end"
              dominantBaseline="central"
              fill={UI.text}
              fontSize={AXIS_TICK.fontSize}
            >
              <title>{payload.value}</title>
              {truncate(payload.value, maxChars)}
            </text>
          )}
          tickLine={false}
          axisLine={{ stroke: UI.line }}
          interval={0}
        />
        <Tooltip
          cursor={{ fill: UI.foam }}
          isAnimationActive={false}
          content={({ active, payload }) => {
            const datum = payload?.[0]?.payload as HBarDatum | undefined;
            if (!active || !datum) return null;
            return (
              <TooltipBox
                title={datum.label}
                rows={[
                  {
                    label: 'Value',
                    value: formatValue(datum.value, format),
                    color: datum.color,
                    note: [
                      datum.share !== undefined ? `${shareLabel(datum.share)} of the total` : '',
                      ...(datum.notes ?? []),
                      onSelect ? (selectHint ?? 'Click to see these orders') : '',
                    ]
                      .filter(Boolean)
                      .join(' · '),
                  },
                ]}
              />
            );
          }}
        />
        <Bar
          dataKey="value"
          radius={[0, BAR_RADIUS, BAR_RADIUS, 0]}
          maxBarSize={28}
          minPointSize={2}
          cursor={onSelect ? 'pointer' : undefined}
          onClick={
            onSelect ? (entry) => onSelect(String((entry.payload as HBarDatum).key)) : undefined
          }
          {...animation}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
          <LabelList
            dataKey="value"
            content={(props) => {
              const datum = data[Number(props.index)];
              if (!datum) return null;
              return (
                <text
                  x={Number(props.x) + Number(props.width) + 6}
                  y={Number(props.y) + Number(props.height) / 2}
                  dominantBaseline="central"
                  fill={UI.text}
                  fontSize={12}
                  fontWeight={600}
                  className="tabular"
                >
                  {detailOf(datum)}
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
