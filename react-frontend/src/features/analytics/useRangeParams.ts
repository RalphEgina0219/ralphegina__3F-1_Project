import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseRange, presetRange, type DateRange, type RangePreset } from '@/lib/analytics/time';

const PRESETS: readonly RangePreset[] = [
  'today',
  '7d',
  '30d',
  'this_month',
  'last_month',
  'custom',
];
export const DEFAULT_PRESET = '30d';

export interface RangeState {
  preset: RangePreset;
  range: DateRange;
  compare: boolean;
  setPreset: (preset: Exclude<RangePreset, 'custom'>) => void;
  setCustom: (range: DateRange) => void;
  setCompare: (on: boolean) => void;
  /** Any other filter kept in the URL (reports). Null removes it. */
  setParam: (changes: Record<string, string | null>) => void;
  params: URLSearchParams;
}

/**
 * The period on screen, kept in the URL (?range=30d, or ?range=custom&from=…&to=…, and
 * &compare=off), so it survives a refresh and the link can be shared.
 */
export function useRangeParams(): RangeState {
  const [params, setParams] = useSearchParams();
  const raw = params.get('range') as RangePreset | null;
  const preset: RangePreset = raw && PRESETS.includes(raw) ? raw : DEFAULT_PRESET;
  const from = params.get('from');
  const to = params.get('to');
  const range = useMemo(
    () =>
      preset === 'custom' ? parseRange(from, to, presetRange(DEFAULT_PRESET)) : presetRange(preset),
    [preset, from, to],
  );
  const compare = params.get('compare') !== 'off';

  const setParam = useCallback(
    (changes: Record<string, string | null>) =>
      setParams(
        (current) => {
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') current.delete(key);
            else current.set(key, value);
          }
          return current;
        },
        { replace: true },
      ),
    [setParams],
  );

  return {
    preset,
    range,
    compare,
    setPreset: (next) =>
      setParam({ range: next === DEFAULT_PRESET ? null : next, from: null, to: null }),
    setCustom: (next) => setParam({ range: 'custom', from: next.from, to: next.to }),
    setCompare: (on) => setParam({ compare: on ? null : 'off' }),
    setParam,
    params,
  };
}
