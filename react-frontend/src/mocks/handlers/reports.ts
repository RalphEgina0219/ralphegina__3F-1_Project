import {
  REPORT_KINDS,
  buildAdminDashboard,
  buildReport,
  buildStaffDashboard,
  type ReportFilters,
  type ReportKind,
} from '@/lib/analytics/build';
import { buildForecast } from '@/lib/analytics/forecast';
import { parseRange, presetRange } from '@/lib/analytics/time';
import { can } from '@/lib/permissions';
import { STATUS_ORDER } from '@/lib/status';
import type { StatusCode } from '@/types/entities';
import { analyticsFacts } from '../analytics';
import { fail, ok, route } from '../http';

function readQuery(query: URLSearchParams) {
  const now = Date.now();
  return {
    range: parseRange(query.get('from'), query.get('to'), presetRange('30d', now)),
    // Compare is on unless asked off: compare=none.
    compare: query.get('compare') !== 'none',
    now,
  };
}

const positive = (value: string | null) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
};

/** Like positive, but 0 counts: it is the wash type surcharge category. */
const serviceId = (value: string | null) => {
  const number = Number(value);
  return value !== null && value !== '' && Number.isInteger(number) && number >= 0
    ? number
    : undefined;
};

function readFilters(query: URLSearchParams): ReportFilters {
  const method = query.get('method');
  const status = query.get('status');
  return {
    service: serviceId(query.get('service')),
    method: method === 'cash' || method === 'gcash' || method === 'maya' ? method : undefined,
    status: STATUS_ORDER.includes(status as StatusCode) ? (status as StatusCode) : undefined,
    staff: positive(query.get('staff')),
    barangay: query.get('barangay')?.trim() || undefined,
    item: positive(query.get('item')),
  };
}

export const reportHandlers = [
  // Staff get a dashboard built without a single peso field: not hidden by the UI, never sent.
  route('get', '/analytics/dashboard', 'dashboard.view', ({ user, query }) => {
    const facts = analyticsFacts();
    const options = readQuery(query);
    return ok(
      can(user, 'sales.view')
        ? buildAdminDashboard(facts, options)
        : buildStaffDashboard(facts, options),
    );
  }),

  // No peso fields: staff and admins get the same forecast.
  route('get', '/analytics/forecast', 'dashboard.view', () =>
    ok(buildForecast(analyticsFacts(), Date.now())),
  ),

  route('get', '/reports/:kind', 'reports.view', ({ params, query }) => {
    const kind = params.kind as ReportKind;
    if (!REPORT_KINDS.includes(kind)) return fail(404, 'There is no such report.');
    return ok(buildReport(kind, analyticsFacts(), readQuery(query), readFilters(query)));
  }),
];
