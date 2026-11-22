import type { RoleName, StatusCode } from '@/types/entities';

export const STATUS_ORDER: readonly StatusCode[] = [
  'received',
  'washing',
  'drying',
  'folding',
  'ready_for_pickup',
  'released',
];

export const BOARD_STATUSES: readonly StatusCode[] = STATUS_ORDER.filter((s) => s !== 'released');

/** What each status is called when the shop has not renamed it. The codes never change. */
export const DEFAULT_STATUS_LABELS: Record<StatusCode, string> = {
  received: 'Received',
  washing: 'Washing',
  drying: 'Drying',
  folding: 'Folding',
  ready_for_pickup: 'Ready for Pickup',
  released: 'Completed',
};

export interface StatusMeta {
  label: string;
  shortLabel: string;
  /** Chip and flow-tile background + text classes. */
  chip: string;
  /** Solid dot classes. */
  dot: string;
  /** Solid fill used for "current" state in buttons and timelines. */
  fg: string;
  /** Sentence on the customer dashboard: "Your laundry is ___". */
  sentence: string;
}

export const STATUS_META: Record<StatusCode, StatusMeta> = {
  received: {
    label: 'Received',
    shortLabel: 'Received',
    chip: 'bg-status-received-bg text-status-received-fg',
    dot: 'bg-status-received-dot',
    fg: 'text-status-received-fg',
    sentence: 'Received at the shop',
  },
  washing: {
    label: 'Washing',
    shortLabel: 'Washing',
    chip: 'bg-status-washing-bg text-status-washing-fg',
    dot: 'bg-status-washing-dot',
    fg: 'text-status-washing-fg',
    sentence: 'Being washed',
  },
  drying: {
    label: 'Drying',
    shortLabel: 'Drying',
    chip: 'bg-status-drying-bg text-status-drying-fg',
    dot: 'bg-status-drying-dot',
    fg: 'text-status-drying-fg',
    sentence: 'Being dried',
  },
  folding: {
    label: 'Folding',
    shortLabel: 'Folding',
    chip: 'bg-status-folding-bg text-status-folding-fg',
    dot: 'bg-status-folding-dot',
    fg: 'text-status-folding-fg',
    sentence: 'Being folded',
  },
  ready_for_pickup: {
    label: 'Ready for Pickup',
    shortLabel: 'Ready',
    chip: 'bg-status-ready-bg text-status-ready-fg',
    dot: 'bg-status-ready-dot',
    fg: 'text-status-ready-fg',
    sentence: 'Ready for pickup',
  },
  // The internal code stays 'released'; people only ever see 'Completed'.
  released: {
    label: 'Completed',
    shortLabel: 'Completed',
    chip: 'bg-status-released-bg text-status-released-fg',
    dot: 'bg-status-released-dot',
    fg: 'text-status-released-fg',
    sentence: 'Completed. Thank you!',
  },
};

export function statusIndex(status: StatusCode): number {
  return STATUS_ORDER.indexOf(status);
}

export function nextStatus(status: StatusCode): StatusCode | null {
  return STATUS_ORDER[statusIndex(status) + 1] ?? null;
}

export function prevStatus(status: StatusCode): StatusCode | null {
  return STATUS_ORDER[statusIndex(status) - 1] ?? null;
}

export type TransitionErrorCode =
  | 'already_completed'
  | 'same_status'
  | 'skip_not_allowed'
  | 'revert_not_allowed'
  | 'revert_reason_required'
  | 'balance_due';

export type TransitionCheck =
  | { ok: true; direction: 'forward' | 'revert' }
  | { ok: false; code: TransitionErrorCode; message: string };

export interface TransitionInput {
  from: StatusCode;
  to: StatusCode;
  role: RoleName;
  balanceCents: number;
  note?: string | null;
}

/** The single source of truth for status rules: used by buttons and by the mock API. */
export function checkTransition({
  from,
  to,
  role,
  balanceCents,
  note,
}: TransitionInput): TransitionCheck {
  // A completed transaction is a closed record: its baskets may already hold someone else's laundry.
  if (from === 'released') {
    return { ok: false, code: 'already_completed', message: 'This transaction is completed.' };
  }

  const distance = statusIndex(to) - statusIndex(from);

  if (distance === 0) {
    return {
      ok: false,
      code: 'same_status',
      message: `The order is already ${STATUS_META[to].label}.`,
    };
  }

  if (distance === 1) {
    if (to === 'released' && balanceCents > 0) {
      return {
        ok: false,
        code: 'balance_due',
        message: 'Settle the balance before completing this order.',
      };
    }
    return { ok: true, direction: 'forward' };
  }

  if (distance > 1) {
    return {
      ok: false,
      code: 'skip_not_allowed',
      message: `Orders move one stage at a time. Next is ${STATUS_META[nextStatus(from) as StatusCode].label}.`,
    };
  }

  if (distance !== -1 || role !== 'admin') {
    return {
      ok: false,
      code: 'revert_not_allowed',
      message: 'Only an administrator can move an order back, and only one stage.',
    };
  }

  if (!note?.trim()) {
    return {
      ok: false,
      code: 'revert_reason_required',
      message: 'Give a reason for moving this order back.',
    };
  }

  return { ok: true, direction: 'revert' };
}

/** Orders still in the shop: everything before Completed. */
export const isActiveStatus = (status: StatusCode) => status !== 'released';

/** The shop's own names for the statuses (Settings > Branding): display only, the rules use the codes. */
export function applyStatusLabels(labels: Partial<Record<StatusCode, string>>) {
  for (const code of STATUS_ORDER) {
    const label = labels[code]?.trim() || DEFAULT_STATUS_LABELS[code];
    STATUS_META[code].label = label;
    STATUS_META[code].shortLabel =
      code === 'ready_for_pickup' && label === DEFAULT_STATUS_LABELS[code] ? 'Ready' : label;
  }
}
