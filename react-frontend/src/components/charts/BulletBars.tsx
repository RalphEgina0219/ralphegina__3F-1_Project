import { useElementSize } from '@/hooks/useElementSize';
import { ALERT, CATEGORICAL, UI } from './chartTheme';

export interface BulletDatum {
  key: string;
  label: string;
  unit: string;
  value: number;
  reference: number;
  status: 'ok' | 'low' | 'critical';
}

const STATUS = {
  ok: { color: CATEGORICAL[0], label: 'OK', mark: '✓' },
  low: { color: ALERT.warn, label: 'Low', mark: '!' },
  critical: { color: ALERT.danger, label: 'Critical', mark: '!!' },
} as const;

const ROW = 46;
const STATUS_WIDTH = 78;

/**
 * On hand vs reorder level, one row per item: the name and amount on top, the bar below, a tick at
 * the reorder level. The status is written out beside each row, never left to colour.
 */
export default function BulletBars({ data }: { data: BulletDatum[] }) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const width = Math.max(260, size.width);
  const track = width - STATUS_WIDTH;
  const height = data.length * ROW + 22;

  return (
    <div ref={ref} className="h-full w-full">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="list"
        aria-label="Stock on hand against reorder levels"
      >
        {data.map((d, index) => {
          const scale = Math.max(d.value, d.reference * 2.5, 1);
          const barWidth = Math.max(2, (d.value / scale) * track);
          const tick = (d.reference / scale) * track;
          const status = STATUS[d.status];
          const y = index * ROW;
          return (
            <g
              key={d.key}
              role="listitem"
              aria-label={`${d.label}: ${d.value} ${d.unit}, reorder level ${d.reference} ${d.unit}, ${status.label}`}
            >
              <text x={0} y={y + 13} fill={UI.text} fontSize={13} fontWeight={600}>
                {d.label}
              </text>
              <text
                x={track}
                y={y + 13}
                textAnchor="end"
                fill={UI.muted}
                fontSize={12}
                className="tabular"
              >
                {d.value} {d.unit}
                {width >= 480 ? ` · reorder ${d.reference}` : ''}
              </text>
              <rect x={0} y={y + 20} width={track} height={12} rx={3} fill={UI.foam} />
              <rect x={0} y={y + 20} width={barWidth} height={12} rx={3} fill={status.color} />
              <line x1={tick} x2={tick} y1={y + 16} y2={y + 36} stroke={UI.ink} strokeWidth={2} />
              <text
                x={track + 10}
                y={y + 30}
                fill={d.status === 'ok' ? UI.muted : UI.text}
                fontSize={12}
                fontWeight={700}
              >
                {status.mark} {status.label}
              </text>
            </g>
          );
        })}
        <g transform={`translate(0, ${data.length * ROW + 4})`}>
          <line x1={1} x2={1} y1={0} y2={12} stroke={UI.ink} strokeWidth={2} />
          <text x={8} y={10} fill={UI.muted} fontSize={12}>
            Reorder level
          </text>
        </g>
      </svg>
    </div>
  );
}
