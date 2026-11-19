import type { PaymentMethodCode, StatusCode } from '@/types/entities';
import type { DateRange, DayKey } from './time';

// ---------------------------------------------------------------------------------------------
// Facts: the rows the aggregations read. The mock builds them from its tables; in Phase 2 they are
// the result of a few joins (see README, "Analytics endpoints").

export interface OrderLineFact {
  service_id: number;
  service_name: string;
  subtotal_cents: number;
  kilos: number;
  pieces: number;
  /** The wash type surcharge, reported as its own revenue category so totals still reconcile. */
  surcharge?: boolean;
}

export interface OrderFact {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  barangay: string;
  wash_type_id: number;
  wash_type: string;
  received_at: string;
  received_by: number;
  promised_at: string;
  /** When it first reached Ready for Pickup, if it has. */
  ready_at: string | null;
  released_at: string | null;
  status: StatusCode;
  /** When it entered its current status. */
  status_since: string;
  total_cents: number;
  /** Paid so far, voided payments excluded. */
  paid_cents: number;
  kilos: number;
  pieces: number;
  express: boolean;
  lines: OrderLineFact[];
}

export interface PaymentFact {
  id: number;
  order_id: number;
  amount_cents: number;
  method: PaymentMethodCode;
  paid_at: string;
  received_by: number;
  voided: boolean;
}

export interface StatusChangeFact {
  order_id: number;
  to_status: StatusCode;
  changed_by: number;
  changed_at: string;
}

export interface MovementFact {
  item_id: number;
  /** Set on usage movements: the order that used the soap. */
  order_id: number | null;
  type: 'in' | 'out' | 'adjust' | 'usage';
  quantity: number;
  moved_at: string;
  user_id: number;
}

export interface ItemFact {
  id: number;
  name: string;
  unit: string;
  on_hand: number;
  reorder_level: number;
  stock_status: 'ok' | 'low' | 'critical';
}

export interface StaffFact {
  id: number;
  name: string;
}

// ---------------------------------------------------------------------------------------------
// Chart-ready output.

export interface TimePoint {
  date: DayKey;
  value: number;
  /** The same position in the comparison range, when one is asked for. */
  previous?: number | null;
}

/** A nullable value: an average on a day with no data is a gap, not zero. */
export interface AveragePoint {
  date: DayKey;
  value: number | null;
  count: number;
}

export interface CategoryValue {
  key: string;
  label: string;
  value: number;
  /** 0 to 1 of the total of the list. */
  share: number;
  /** Extra numbers for tooltips and tables. */
  extra?: Record<string, number>;
}

export interface HeatmapData {
  /** 0 = Monday … 6 = Sunday. */
  weekdays: number[];
  hours: number[];
  /** cells[weekday][hourIndex] */
  cells: number[][];
  max: number;
  total: number;
}

export interface StackedPoint {
  key: string;
  label: string;
  values: Record<string, number>;
}

export interface KpiValue {
  key: string;
  label: string;
  format: ValueFormat;
  value: number | null;
  previous: number | null;
  /** Percent change vs the previous period, one decimal; null when there is nothing to compare. */
  delta_pct: number | null;
  /** The trend behind the value, for the sparkline. */
  spark?: number[];
  tone?: 'default' | 'warn' | 'ok';
  hint?: string;
  /** For "18 / 30" cards. */
  progress?: { value: number; max: number };
  /** When up is bad (unpaid balances, waiting time). */
  inverse?: boolean;
}

export type ValueFormat = 'money' | 'count' | 'kg' | 'hours' | 'percent' | 'number';

export type ColumnFormat = ValueFormat | 'text' | 'date' | 'datetime' | 'order';

export interface ReportColumn {
  key: string;
  label: string;
  format: ColumnFormat;
  /** Hidden until switched on in the Columns menu. */
  optional?: boolean;
}

export type Cell = string | number | null;

export interface ReportTable {
  columns: ReportColumn[];
  rows: Record<string, Cell>[];
  totals: Record<string, Cell> | null;
}

export interface AnalyticsEnvelope<S> {
  range: DateRange;
  compare_range: DateRange | null;
  generated_at: string;
  kpis: KpiValue[];
  series: S;
  table: ReportTable | null;
  insights: string[];
}
