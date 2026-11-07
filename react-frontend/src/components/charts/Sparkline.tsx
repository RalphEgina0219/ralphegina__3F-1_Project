import { useElementSize } from '@/hooks/useElementSize';
import { UI } from './chartTheme';

/** A 40 px trend line for KPI cards: no axes, no labels, the last point marked. Decorative. */
export function Sparkline({
  values,
  color = UI.flow,
}: {
  values: readonly number[];
  color?: string;
}) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const width = Math.max(40, size.width);
  const height = 40;
  const pad = 4;
  if (values.length < 2) return <div ref={ref} className="h-10" aria-hidden="true" />;
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const points = values.map((value, index) => [
    pad + (index / (values.length - 1)) * (width - pad * 2),
    height - pad - ((value - min) / span) * (height - pad * 2),
  ]);
  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x?.toFixed(1)},${y?.toFixed(1)}`)
    .join(' ');
  const last = points[points.length - 1] as number[];
  return (
    <div ref={ref} className="h-10 w-full" aria-hidden="true">
      <svg width={width} height={height}>
        <path
          d={`${path} L${last[0]},${height - pad} L${pad},${height - pad} Z`}
          fill={color}
          fillOpacity={0.12}
        />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={last[0]}
          cy={last[1]}
          r={3}
          fill={color}
          stroke={UI.surface}
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
