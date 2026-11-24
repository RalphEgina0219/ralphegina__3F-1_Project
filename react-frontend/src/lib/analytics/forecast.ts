/**
 * Demand forecast: the shop's machine-learning feature.
 *
 * A ridge linear regression learns, from the last 8 weeks of orders, a steady trend plus how much
 * busier each weekday is than Monday, and extrapolates the next 7 days. Two models are trained on
 * every request (it takes well under a millisecond): one for the number of orders, one for kilos.
 * The kilos forecast times the shop's recent soap use per kilo gives the soap to have on hand.
 *
 * The model is judged honestly: it is retrained without the last 7 days, asked to predict them, and
 * its mean absolute error is compared with a naive guess (same weekday last week).
 *
 * laravel-backend/app/Support/Analytics/Forecast.php is a line-for-line port, and both are held to
 * the same answers by shared/forecast-cases.json. Keep the order of operations identical.
 */
import { formatAmount } from '@/lib/wash';
import type { AnalyticsFacts } from './build';
import { addDays, diffDays, manilaDay, weekdayOf, type DayKey } from './time';

/** How many days the model learns from (8 weeks), ending yesterday: today is not over yet. */
export const TRAINING_DAYS = 56;
/** Fewer days than this and the forecast says so instead of guessing. */
export const MIN_TRAINING_DAYS = 14;
/** The days held back to measure the error, when there are enough. */
export const HOLDOUT_DAYS = 7;
/** Today and the 6 days after it. */
export const HORIZON_DAYS = 7;
/** Ridge penalty on every coefficient but the intercept: keeps the fit stable on short histories. */
export const RIDGE_LAMBDA = 0.5;
/** z for an 80% prediction interval under normal residuals. */
const INTERVAL_Z = 1.2816;

export const FEATURE_NAMES = [
  'intercept',
  'trend (per week)',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export interface DailyValue {
  date: DayKey;
  value: number;
}

export interface RegressionModel {
  /** The first training day: the trend counts weeks from here. */
  start: DayKey;
  intercept: number;
  trend_per_week: number;
  /** Extra demand on each weekday compared with Monday (index 0 = Monday, always 0). */
  weekday: number[];
  /** Standard deviation of the training residuals. */
  residual_sd: number;
  /** Share of the day-to-day variation the model explains, or null for a flat history. */
  r2: number | null;
  n: number;
}

const round = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.floor(value * factor + 0.5) / factor;
};

/** One row of the design matrix: [1, weeks since start, Tue, Wed, Thu, Fri, Sat, Sun]. */
export function features(index: number, weekday: number): number[] {
  const row = [1, index / 7];
  for (let k = 1; k < 7; k += 1) row.push(weekday === k ? 1 : 0);
  return row;
}

/** Solves a·x = b by Gaussian elimination with partial pivoting. a and b are not changed. */
export function solve(a: readonly (readonly number[])[], b: readonly number[]): number[] {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i] as number]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) {
      if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
    }
    if (Math.abs(m[pivot]![col]!) < 1e-12) throw new Error('The system has no unique solution');
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];
    for (let r = col + 1; r < n; r += 1) {
      const factor = m[r]![col]! / m[col]![col]!;
      for (let c = col; c <= n; c += 1) m[r]![c] = m[r]![c]! - factor * m[col]![c]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r -= 1) {
    let sum = m[r]![n]!;
    for (let c = r + 1; c < n; c += 1) sum -= m[r]![c]! * x[c]!;
    x[r] = sum / m[r]![r]!;
  }
  return x;
}

/** The raw prediction for a day, before clamping at zero. */
function raw(model: RegressionModel, date: DayKey): number {
  const weeks = diffDays(model.start, date) / 7;
  return model.intercept + model.trend_per_week * weeks + (model.weekday[weekdayOf(date)] ?? 0);
}

/** The model's prediction for any day: demand is never negative. */
export function predict(model: RegressionModel, date: DayKey): number {
  return Math.max(0, raw(model, date));
}

/** Fits the trend + weekday model to consecutive days by ridge least squares (normal equations). */
export function fitModel(points: readonly DailyValue[], lambda = RIDGE_LAMBDA): RegressionModel {
  const p = FEATURE_NAMES.length;
  const xtx = Array.from({ length: p }, () => new Array<number>(p).fill(0));
  const xty = new Array<number>(p).fill(0);
  points.forEach((point, i) => {
    const x = features(i, weekdayOf(point.date));
    for (let r = 0; r < p; r += 1) {
      xty[r] = xty[r]! + x[r]! * point.value;
      for (let c = 0; c < p; c += 1) xtx[r]![c] = xtx[r]![c]! + x[r]! * x[c]!;
    }
  });
  for (let r = 1; r < p; r += 1) xtx[r]![r] = xtx[r]![r]! + lambda;
  const beta = solve(xtx, xty);

  const model: RegressionModel = {
    start: points[0]?.date ?? '',
    intercept: beta[0]!,
    trend_per_week: beta[1]!,
    weekday: [0, ...beta.slice(2)],
    residual_sd: 0,
    r2: null,
    n: points.length,
  };
  let mean = 0;
  for (const point of points) mean += point.value;
  mean /= Math.max(1, points.length);
  let ssRes = 0;
  let ssTot = 0;
  for (const point of points) {
    const residual = point.value - raw(model, point.date);
    ssRes += residual * residual;
    ssTot += (point.value - mean) * (point.value - mean);
  }
  model.residual_sd = Math.sqrt(ssRes / Math.max(1, points.length - p));
  model.r2 = ssTot > 0 ? 1 - ssRes / ssTot : null;
  return model;
}

export interface Evaluation {
  /** Mean absolute error of the model on the held-back days. */
  mae: number;
  /** The same for "same weekday last week". */
  baseline_mae: number;
  days: number;
}

/**
 * Trains on all but the last HOLDOUT_DAYS and scores the predictions for those days, next to the
 * seasonal naive guess. Null when the history is too short to hold days back.
 */
export function evaluate(points: readonly DailyValue[], lambda = RIDGE_LAMBDA): Evaluation | null {
  if (points.length < MIN_TRAINING_DAYS + HOLDOUT_DAYS) return null;
  const cut = points.length - HOLDOUT_DAYS;
  const model = fitModel(points.slice(0, cut), lambda);
  let error = 0;
  let baselineError = 0;
  for (let i = cut; i < points.length; i += 1) {
    const point = points[i]!;
    error += Math.abs(predict(model, point.date) - point.value);
    baselineError += Math.abs(points[i - 7]!.value - point.value);
  }
  return {
    mae: error / HOLDOUT_DAYS,
    baseline_mae: baselineError / HOLDOUT_DAYS,
    days: HOLDOUT_DAYS,
  };
}

export interface ForecastPoint {
  date: DayKey;
  /** What actually happened (null for days still ahead). */
  actual: number | null;
  /** What the model says for that day. */
  predicted: number;
  /** 80% prediction interval, on forecast days only. */
  low: number | null;
  high: number | null;
}

export interface ForecastTarget {
  key: 'orders' | 'kilos';
  label: string;
  format: 'count' | 'kg';
  coefficients: { name: string; value: number }[];
  r2: number | null;
  residual_sd: number;
  evaluation: Evaluation | null;
  /** The training days with the model's fit, then the forecast days. */
  points: ForecastPoint[];
  /** The predicted sum over the forecast days. */
  forecast_total: number;
}

/** Trains a model on points and forecasts the horizon days, rounded for the response. */
export function forecastTarget(
  key: ForecastTarget['key'],
  points: readonly DailyValue[],
  horizon: readonly DayKey[],
): ForecastTarget {
  const digits = 1;
  const model = fitModel(points);
  const evaluation = evaluate(points);
  const spread = INTERVAL_Z * model.residual_sd;
  const future = horizon.map((date) => {
    const value = predict(model, date);
    return {
      date,
      actual: null,
      predicted: round(value, digits),
      low: round(Math.max(0, value - spread), digits),
      high: round(value + spread, digits),
    };
  });
  let sum = 0;
  for (const date of horizon) sum += predict(model, date);
  return {
    key,
    label: key === 'orders' ? 'Orders' : 'Kilos',
    format: key === 'orders' ? 'count' : 'kg',
    coefficients: [model.intercept, model.trend_per_week, ...model.weekday.slice(1)].map(
      (value, i) => ({ name: FEATURE_NAMES[i] as string, value: round(value, 2) }),
    ),
    r2: model.r2 === null ? null : round(model.r2, 3),
    residual_sd: round(model.residual_sd, 2),
    evaluation: evaluation && {
      mae: round(evaluation.mae, 2),
      baseline_mae: round(evaluation.baseline_mae, 2),
      days: evaluation.days,
    },
    points: [
      ...points.map((point) => ({
        date: point.date,
        actual: point.value,
        predicted: round(predict(model, point.date), digits),
        low: null,
        high: null,
      })),
      ...future,
    ],
    forecast_total: round(sum, 1),
  };
}

export interface SoapForecast {
  item_id: number;
  label: string;
  unit: string;
  /** Recent use per kilo of laundry, in the item's unit. */
  per_kg: number;
  /** Expected use over the forecast days. */
  needed: number;
  on_hand: number;
  /** How much to buy to cover the forecast, 0 when there is enough. */
  short_by: number;
  needed_label: string;
  on_hand_label: string;
}

export interface ForecastResponse {
  status: 'ready' | 'insufficient_data';
  generated_at: string;
  today: DayKey;
  training: { from: DayKey | null; to: DayKey; days: number; min_days: number };
  horizon: { from: DayKey; to: DayKey; days: number };
  model: {
    algorithm: string;
    features: string[];
    lambda: number;
    holdout_days: number;
    interval: string;
  };
  targets: ForecastTarget[];
  soap: SoapForecast[];
}

/** Builds the forecast from the analytics facts, as of now (epoch ms). */
export function buildForecast(facts: AnalyticsFacts, now: number): ForecastResponse {
  const today = manilaDay(now);
  const yesterday = addDays(today, -1);
  const horizon = Array.from({ length: HORIZON_DAYS }, (_, i) => addDays(today, i));

  // Days before the first order are days before the shop used the system, not days with no work.
  let first: DayKey | null = null;
  const orders = new Map<DayKey, number>();
  const kilos = new Map<DayKey, number>();
  for (const order of facts.orders) {
    const day = manilaDay(order.received_at);
    if (first === null || day < first) first = day;
    orders.set(day, (orders.get(day) ?? 0) + 1);
    kilos.set(day, (kilos.get(day) ?? 0) + order.kilos);
  }
  const windowStart = addDays(yesterday, 1 - TRAINING_DAYS);
  const from = first === null ? null : first > windowStart ? first : windowStart;
  const days = from === null || from > yesterday ? 0 : diffDays(from, yesterday) + 1;
  const dates = Array.from({ length: days }, (_, i) => addDays(from as DayKey, i));

  const response: ForecastResponse = {
    status: days >= MIN_TRAINING_DAYS ? 'ready' : 'insufficient_data',
    generated_at: new Date(now).toISOString(),
    today,
    training: { from: days > 0 ? from : null, to: yesterday, days, min_days: MIN_TRAINING_DAYS },
    horizon: { from: today, to: horizon[HORIZON_DAYS - 1] as DayKey, days: HORIZON_DAYS },
    model: {
      algorithm: 'Ridge linear regression (least squares)',
      features: [...FEATURE_NAMES],
      lambda: RIDGE_LAMBDA,
      holdout_days: HOLDOUT_DAYS,
      interval: '80% prediction interval',
    },
    targets: [],
    soap: [],
  };
  if (response.status !== 'ready') return response;

  const orderTarget = forecastTarget(
    'orders',
    dates.map((date) => ({ date, value: orders.get(date) ?? 0 })),
    horizon,
  );
  const kiloTarget = forecastTarget(
    'kilos',
    dates.map((date) => ({ date, value: round(kilos.get(date) ?? 0, 1) })),
    horizon,
  );
  response.targets = [orderTarget, kiloTarget];
  response.soap = soapForecast(facts, dates[0] as DayKey, yesterday, kiloTarget.forecast_total);
  return response;
}

/**
 * Soap per kilo over the training days (from the first soap deduction on, since older orders
 * deducted none), times the forecast kilos. Only items the shop actually used.
 */
function soapForecast(
  facts: AnalyticsFacts,
  from: DayKey,
  to: DayKey,
  forecastKilos: number,
): SoapForecast[] {
  let usageStart: DayKey | null = null;
  for (const m of facts.movements) {
    if (m.type !== 'usage') continue;
    const day = manilaDay(m.moved_at);
    if (usageStart === null || day < usageStart) usageStart = day;
  }
  if (usageStart === null) return [];
  const start = usageStart > from ? usageStart : from;
  if (start > to) return [];

  let kilos = 0;
  for (const order of facts.orders) {
    const day = manilaDay(order.received_at);
    if (day >= start && day <= to) kilos += order.kilos;
  }
  if (kilos <= 0) return [];

  const used = new Map<number, number>();
  for (const m of facts.movements) {
    if (m.type !== 'usage') continue;
    const day = manilaDay(m.moved_at);
    if (day >= start && day <= to) used.set(m.item_id, (used.get(m.item_id) ?? 0) + m.quantity);
  }
  const out: SoapForecast[] = [];
  for (const item of facts.items) {
    const amount = used.get(item.id);
    if (amount === undefined || amount <= 0) continue;
    const perKg = amount / kilos;
    // Pieces are bought whole; kg and L keep three decimals (1 g or 1 mL).
    const exact = round(perKg * forecastKilos, 6);
    const needed = item.unit === 'pcs' ? Math.ceil(exact) : round(exact, 3);
    const onHand = round(item.on_hand, 3);
    const short = round(Math.max(0, needed - onHand), 3);
    out.push({
      item_id: item.id,
      label: item.name,
      unit: item.unit,
      per_kg: round(perKg, 4),
      needed,
      on_hand: onHand,
      short_by: short,
      needed_label: formatAmount(item.unit, needed),
      on_hand_label: formatAmount(item.unit, onHand),
    });
  }
  return out;
}
