import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  evaluate,
  fitModel,
  forecastTarget,
  predict,
  solve,
  type DailyValue,
  type RegressionModel,
} from './forecast';

// One set of cases for both sides: laravel-backend/tests/Unit/ForecastTest.php reads the same file.
interface ModelCase {
  name: string;
  lambda: number;
  points: DailyValue[];
  expected: Pick<
    RegressionModel,
    'intercept' | 'trend_per_week' | 'weekday' | 'residual_sd' | 'r2'
  >;
  predict?: { date: string; expected: number }[];
}
const cases = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../../../../shared/forecast-cases.json'), 'utf8'),
) as {
  solve: { name: string; a: number[][]; b: number[]; expected: number[] }[];
  exact: ModelCase;
  ridge: ModelCase & { evaluation: { mae: number; baseline_mae: number } };
  short: ModelCase;
  target: {
    name: string;
    key: 'orders';
    points: DailyValue[];
    horizon: string[];
    expected: unknown;
  };
};

function expectModel(model: RegressionModel, expected: ModelCase['expected']) {
  expect(model.intercept).toBeCloseTo(expected.intercept, 9);
  expect(model.trend_per_week).toBeCloseTo(expected.trend_per_week, 9);
  expected.weekday.forEach((value, i) => expect(model.weekday[i]).toBeCloseTo(value, 9));
  expect(model.residual_sd).toBeCloseTo(expected.residual_sd, 6);
  expect(model.r2).toBeCloseTo(expected.r2 as number, 9);
}

describe('solve', () => {
  it.each(cases.solve)('$name', ({ a, b, expected }) => {
    solve(a, b).forEach((value, i) => expect(value).toBeCloseTo(expected[i] as number, 12));
  });

  it('refuses a singular system', () => {
    expect(() =>
      solve(
        [
          [1, 2],
          [2, 4],
        ],
        [1, 2],
      ),
    ).toThrow();
  });
});

describe('fitModel', () => {
  it.each([cases.exact, cases.ridge, cases.short])('$name', (c) => {
    const model = fitModel(c.points, c.lambda);
    expectModel(model, c.expected);
    for (const p of c.predict ?? []) expect(predict(model, p.date)).toBeCloseTo(p.expected, 9);
  });

  it('never predicts negative demand', () => {
    const falling = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-09-${String(7 + i).padStart(2, '0')}`,
      value: 14 - i,
    }));
    expect(predict(fitModel(falling), '2026-10-30')).toBe(0);
  });
});

describe('evaluate', () => {
  it('scores the held-back week and beats the naive guess', () => {
    const evaluation = evaluate(cases.ridge.points);
    expect(evaluation?.mae).toBeCloseTo(cases.ridge.evaluation.mae, 9);
    expect(evaluation?.baseline_mae).toBeCloseTo(cases.ridge.evaluation.baseline_mae, 9);
    expect(evaluation!.mae).toBeLessThan(evaluation!.baseline_mae);
  });

  it('holds nothing back on a short history', () => {
    expect(evaluate(cases.short.points)).toBeNull();
  });
});

it(cases.target.name, () => {
  const { key, points, horizon, expected } = cases.target;
  expect(forecastTarget(key, points, horizon)).toEqual(expected);
});
