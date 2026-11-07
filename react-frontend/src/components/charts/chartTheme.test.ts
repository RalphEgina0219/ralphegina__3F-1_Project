import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALERT,
  CATEGORICAL,
  SEQUENTIAL,
  STAGE_COLORS,
  UI,
  sequentialColor,
  serviceColor,
} from './chartTheme';
import { foldSlices } from './DonutChart';

const css = readFileSync(path.resolve(import.meta.dirname, '../../index.css'), 'utf8');
const token = (name: string) =>
  css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();

describe('chart theme', () => {
  it('reuses the status, alert and ink tokens from index.css', () => {
    expect(STAGE_COLORS.received).toBe(token('status-received-dot'));
    expect(STAGE_COLORS.washing).toBe(token('status-washing-dot'));
    expect(STAGE_COLORS.drying).toBe(token('status-drying-dot'));
    expect(STAGE_COLORS.folding).toBe(token('status-folding-dot'));
    expect(STAGE_COLORS.ready_for_pickup).toBe(token('status-ready-dot'));
    expect(STAGE_COLORS.released).toBe(token('status-released-dot'));
    expect(ALERT.warn).toBe(token('warn-bar'));
    expect(ALERT.danger).toBe(token('danger-bar'));
    expect(UI.text).toBe(token('text'));
    expect(UI.muted).toBe(token('muted'));
    expect(UI.line).toBe(token('line'));
    expect(UI.flow).toBe(token('flow'));
    expect(SEQUENTIAL[4].toLowerCase()).toBe(token('flow'));
  });

  it('keeps one colour per service everywhere, in the fixed order', () => {
    expect(serviceColor(1)).toBe(CATEGORICAL[0]);
    expect(serviceColor('2')).toBe(CATEGORICAL[1]);
    expect(serviceColor(6)).toBe(CATEGORICAL[5]);
    expect(serviceColor(99)).not.toBe(CATEGORICAL[0]);
  });

  it('shades the heatmap in six steps, zero lightest', () => {
    expect(sequentialColor(0, 10)).toBe(SEQUENTIAL[0]);
    expect(sequentialColor(10, 10)).toBe(SEQUENTIAL[5]);
    expect(sequentialColor(1, 10)).toBe(SEQUENTIAL[1]);
  });

  it('never draws a donut with more than 5 slices', () => {
    const slices = Array.from({ length: 7 }, (_, i) => ({
      key: String(i),
      label: `S${i}`,
      value: 10 - i,
      share: (10 - i) / 49,
      color: '#000000',
    }));
    const folded = foldSlices(slices);
    expect(folded).toHaveLength(5);
    expect(folded[4]?.label).toBe('Other');
    expect(folded.reduce((s, d) => s + d.value, 0)).toBe(49);
  });
});
