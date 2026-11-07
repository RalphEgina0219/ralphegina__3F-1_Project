import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  useChartHeight,
  useChartWidth,
} from 'recharts';
import type { ValueFormat } from '@/lib/analytics/types';
import { OTHER_COLOR, UI } from './chartTheme';
import { TooltipBox } from './ChartTooltip';
import { formatValue, shareLabel } from './format';
import { useChartAnimation } from './motion';

export interface DonutDatum {
  key: string;
  label: string;
  value: number;
  color: string;
  share: number;
}

interface DonutChartProps {
  data: DonutDatum[];
  format: ValueFormat;
  /** The total in the middle, with a word under it. */
  center: { value: string; label: string };
}

/** Never more than 5 slices: the smallest fold into "Other". */
export function foldSlices(data: DonutDatum[], max = 5): DonutDatum[] {
  if (data.length <= max) return data;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const kept = sorted.slice(0, max - 1);
  const rest = sorted.slice(max - 1);
  return [
    ...kept,
    {
      key: 'other',
      label: 'Other',
      value: rest.reduce((s, d) => s + d.value, 0),
      share: rest.reduce((s, d) => s + d.share, 0),
      color: OTHER_COLOR,
    },
  ];
}

/** The total in the hole. Part of the SVG, so it is in the PNG download too. */
function CenterLabel({ value, label }: { value: string; label: string }) {
  const width = useChartWidth();
  const height = useChartHeight();
  if (!width || !height) return null;
  const cx = width / 2;
  const cy = height / 2;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.45em" fill={UI.text} fontSize={20} fontWeight={800} className="tabular">
        {value}
      </tspan>
      <tspan x={cx} dy="1.5em" fill={UI.muted} fontSize={12}>
        {label}
      </tspan>
    </text>
  );
}

/**
 * A part-to-whole of 2–4 items with the total in the middle. The legend beside it carries the
 * amounts and shares, so no value depends on telling the colours apart.
 */
export default function DonutChart({ data, format, center }: DonutChartProps) {
  const animation = useChartAnimation();
  const slices = foldSlices(data);
  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={0}
      initialDimension={{ width: 320, height: 240 }}
    >
      <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Tooltip
          isAnimationActive={false}
          content={({ active, payload }) => {
            const datum = payload?.[0]?.payload as DonutDatum | undefined;
            if (!active || !datum) return null;
            return (
              <TooltipBox
                title={datum.label}
                rows={[
                  {
                    label: 'Collected',
                    value: formatValue(datum.value, format),
                    color: datum.color,
                    note: `${shareLabel(datum.share)} of the total`,
                  },
                ]}
              />
            );
          }}
        />
        <Pie
          data={slices}
          dataKey="value"
          nameKey="label"
          innerRadius="64%"
          outerRadius="90%"
          startAngle={90}
          endAngle={-270}
          stroke={UI.surface}
          strokeWidth={2}
          {...animation}
        >
          {slices.map((slice) => (
            <Cell key={slice.key} fill={slice.color} />
          ))}
        </Pie>
        <CenterLabel value={center.value} label={center.label} />
      </PieChart>
    </ResponsiveContainer>
  );
}
