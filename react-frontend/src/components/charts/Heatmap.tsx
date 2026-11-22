import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { WEEKDAYS, WEEKDAYS_LONG, formatHour } from '@/lib/analytics/time';
import type { HeatmapData } from '@/lib/analytics/types';
import { useElementSize } from '@/hooks/useElementSize';
import { UI, sequentialColor, sequentialRamp } from './chartTheme';
import { TooltipBox } from './ChartTooltip';

interface HeatmapProps {
  data: HeatmapData;
  /** "drop-offs" */
  unit: string;
}

const LABEL_WIDTH = 36;
const AXIS_HEIGHT = 20;
const LEGEND_HEIGHT = 34;
const GAP = 2;

/**
 * Weekday × hour in one teal hue, light to dark, with a scale legend. Recharts has no heatmap, so
 * this is a small SVG in the same style. Arrow keys move between cells; the tooltip follows.
 */
export default function Heatmap({ data, unit }: HeatmapProps) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const width = Math.max(240, size.width);
  const height = Math.max(160, size.height);
  const cols = data.hours.length;
  const cellW = (width - LABEL_WIDTH - GAP * (cols - 1)) / cols;
  const cellH = (height - AXIS_HEIGHT - LEGEND_HEIGHT - GAP * 6) / 7;
  const narrow = cellW < 30;

  // A tap outside the chart (ChartCard sends "chartdismiss") closes the tooltip.
  useEffect(() => {
    const plot = ref.current?.closest('[data-chart-plot]');
    const close = () => setActive(null);
    plot?.addEventListener('chartdismiss', close);
    return () => plot?.removeEventListener('chartdismiss', close);
  }, [ref]);

  const onKeyDown = (event: KeyboardEvent) => {
    const current = active ?? { row: 0, col: 0 };
    const moves: Record<string, [number, number]> = {
      ArrowRight: [0, 1],
      ArrowLeft: [0, -1],
      ArrowDown: [1, 0],
      ArrowUp: [-1, 0],
    };
    if (event.key === 'Escape') {
      setActive(null);
      return;
    }
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setActive({
      row: Math.min(6, Math.max(0, current.row + move[0])),
      col: Math.min(cols - 1, Math.max(0, current.col + move[1])),
    });
  };

  const x = (col: number) => LABEL_WIDTH + col * (cellW + GAP);
  const y = (row: number) => row * (cellH + GAP);
  const value = active ? (data.cells[active.row]?.[active.col] ?? 0) : 0;
  const tipLeft = active ? Math.min(width - 170, Math.max(0, x(active.col) + cellW / 2 - 80)) : 0;
  const tipTop = active ? Math.max(0, y(active.row) - 64) : 0;

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="application"
        aria-roledescription="heatmap"
        aria-label="Use the arrow keys to read each weekday and hour"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        onMouseLeave={() => setActive(null)}
        className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flow"
      >
        {WEEKDAYS.map((day, row) => (
          <text
            key={day}
            x={0}
            y={y(row) + cellH / 2}
            dominantBaseline="central"
            fill={UI.muted}
            fontSize={12}
          >
            {day}
          </text>
        ))}
        {data.hours.map((hour, col) =>
          !narrow || col % 2 === 0 ? (
            <text
              key={hour}
              x={x(col) + cellW / 2}
              y={y(6) + cellH + 15}
              textAnchor="middle"
              fill={UI.muted}
              fontSize={12}
            >
              {narrow
                ? formatHour(hour).replace(' ', '').toLowerCase().replace('m', '')
                : formatHour(hour)}
            </text>
          ) : null,
        )}
        {data.cells.map((row, r) =>
          row.map((count, c) => {
            const selected = active?.row === r && active.col === c;
            return (
              <rect
                key={`${r}-${c}`}
                x={x(c)}
                y={y(r)}
                width={cellW}
                height={cellH}
                rx={3}
                fill={sequentialColor(count, data.max)}
                stroke={selected ? UI.ink : 'none'}
                strokeWidth={selected ? 2 : 0}
                onMouseEnter={() => setActive({ row: r, col: c })}
                onPointerDown={() => setActive({ row: r, col: c })}
              />
            );
          }),
        )}
        {/* Scale legend: the six steps, fewest to most. */}
        <g transform={`translate(${LABEL_WIDTH}, ${height - LEGEND_HEIGHT + 12})`}>
          <text x={0} y={10} fill={UI.muted} fontSize={12}>
            Fewer
          </text>
          {sequentialRamp().map((color, index) => (
            <rect
              key={color}
              x={44 + index * 22}
              y={0}
              width={20}
              height={14}
              rx={2}
              fill={color}
            />
          ))}
          <text x={44 + sequentialRamp().length * 22 + 4} y={10} fill={UI.muted} fontSize={12}>
            More ({data.max} max)
          </text>
        </g>
      </svg>
      {active && (
        <div className="absolute z-10" style={{ left: tipLeft, top: tipTop }}>
          <TooltipBox
            title={`${WEEKDAYS_LONG[active.row]}, ${formatHour(data.hours[active.col] as number)}–${formatHour((data.hours[active.col] as number) + 1)}`}
            rows={[
              {
                label: 'Drop-offs',
                value: `${value} ${value === 1 ? unit.replace(/s$/, '') : unit}`,
                color: sequentialColor(value, data.max),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
