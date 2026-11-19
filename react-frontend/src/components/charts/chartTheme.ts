/**
 * The one place chart colours and mark styles live. Every chart imports from here; no component
 * writes a raw colour. Values are hex (not CSS variables) so an exported PNG keeps them.
 * chartTheme.test.ts checks that the shared ones still match the tokens in index.css.
 */
import type { StatusCode } from '@/types/entities';

/** Fixed order, never cycled. Validated for colour-blind safety on adjacent pairs. */
export const CATEGORICAL = [
  '#0891B2', // teal
  '#EB6834', // orange
  '#6250D6', // violet
  '#1BAF7A', // green
  '#EDA100', // yellow
  '#D55181', // magenta
] as const;

/** A seventh category and beyond fold into "Other". */
export const OTHER_COLOR = '#9AAFB8';

/**
 * Teal and yellow are under 3:1 on white. A chart that uses them shows direct labels (values next
 * to the marks) or has its table view, so no value depends on telling the colour apart.
 */
export const LOW_CONTRAST: ReadonlySet<string> = new Set([CATEGORICAL[0], CATEGORICAL[4]]);

/** One teal hue, light to dark: heatmap cells and intensity. */
export const SEQUENTIAL = [
  '#E6F4F8',
  '#B5DDE8',
  '#6FBBD0',
  '#2E93B0',
  '#0E7490',
  '#0B4F63',
] as const;

/** Laundry stages keep the status colours used everywhere else (index.css *-dot tokens). */
export const STAGE_COLORS: Record<StatusCode, string> = {
  received: '#64748b',
  washing: '#0369a1',
  drying: '#d97706',
  folding: '#7c3aed',
  ready_for_pickup: '#059669',
  released: '#334155',
};

/** Alerts and aging only, always with an icon and a label (index.css *-bar tokens). */
export const ALERT = { ok: '#059669', warn: '#f59e0b', danger: '#dc2626' } as const;

/** Ink, text and surface tokens from index.css. */
export const UI = {
  text: '#10242e',
  muted: '#557380',
  line: '#dce7ec',
  lineStrong: '#cfdde4',
  surface: '#ffffff',
  foam: '#f3f8fa',
  flow: '#0e7490',
  ink: '#0b2e3f',
} as const;

/**
 * Colour follows the entity: Wash-Dry-Fold is teal in every chart, on every page, and filtering
 * never repaints what is left. Service ids from the services table.
 */
const SERVICE_ORDER = [1, 2, 3, 4, 5, 6] as const;
export function serviceColor(serviceId: number | string): string {
  const index = SERVICE_ORDER.indexOf(Number(serviceId) as (typeof SERVICE_ORDER)[number]);
  return index >= 0 ? (CATEGORICAL[index] as string) : OTHER_COLOR;
}

/** Cash and GCash keep their colours; Maya takes the next one in the fixed palette. */
export const METHOD_COLORS = {
  cash: CATEGORICAL[0],
  gcash: CATEGORICAL[1],
  maya: CATEGORICAL[2],
} as const;
export type MethodKey = keyof typeof METHOD_COLORS;
export const CUSTOMER_COLORS = { new: CATEGORICAL[0], returning: CATEGORICAL[1] } as const;

/** Colour for the n-th entry of a list without a fixed entity colour (barangays, staff). */
export function categoricalAt(index: number): string {
  return index < CATEGORICAL.length ? (CATEGORICAL[index] as string) : OTHER_COLOR;
}

/** Heatmap shade for a count, from the six sequential steps. Zero stays the lightest. */
export function sequentialColor(value: number, max: number): string {
  if (max <= 0 || value <= 0) return SEQUENTIAL[0];
  const step = Math.min(
    SEQUENTIAL.length - 1,
    1 + Math.floor((value / max) * (SEQUENTIAL.length - 1)),
  );
  return SEQUENTIAL[step] as string;
}

// Marks and anatomy -------------------------------------------------------------------------

export const LINE = { strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
export const AREA_FILL_OPACITY = 0.14;
export const ACTIVE_DOT = { r: 5, stroke: UI.surface, strokeWidth: 2 } as const;
export const PREVIOUS_LINE = {
  stroke: UI.muted,
  strokeWidth: 1.5,
  strokeDasharray: '5 4',
} as const;
export const REFERENCE_LINE = { stroke: UI.muted, strokeWidth: 1, strokeDasharray: '4 4' } as const;
/** Rounded data end, square baseline. */
export const BAR_RADIUS = 4;
export const MAX_BAR_SIZE = 40;
/** Surface-coloured gap between bars and stacked segments. */
export const BAR_GAP = 2;
export const GRID = { stroke: UI.line, strokeDasharray: '3 3', vertical: false } as const;
export const AXIS_TICK = { fontSize: 12, fill: UI.muted } as const;
export const ANIMATION_MS = 300;

/** Fixed plot heights: 280 px on desktop, 232 px on phones. */
export const PLOT_HEIGHT_CLASS = 'h-[232px] md:h-[280px]';
