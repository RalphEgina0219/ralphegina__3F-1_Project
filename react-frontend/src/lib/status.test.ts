import { describe, expect, it } from 'vitest';
import { checkTransition, nextStatus, prevStatus, STATUS_META, STATUS_ORDER } from './status';

const base = { role: 'staff', balanceCents: 0 } as const;

describe('status order', () => {
  it('is the fixed six-stage lifecycle', () => {
    expect(STATUS_ORDER.map((s) => STATUS_META[s].label)).toEqual([
      'Received',
      'Washing',
      'Drying',
      'Folding',
      'Ready for Pickup',
      'Completed',
    ]);
  });

  it('shows Completed for the internal released code everywhere', () => {
    expect(STATUS_META.released.label).toBe('Completed');
    expect(STATUS_META.released.shortLabel).toBe('Completed');
    expect(STATUS_ORDER.at(-1)).toBe('released');
  });

  it('steps forward and back', () => {
    expect(nextStatus('received')).toBe('washing');
    expect(nextStatus('released')).toBeNull();
    expect(prevStatus('received')).toBeNull();
  });
});

describe('checkTransition', () => {
  it('allows one step forward for anyone', () => {
    expect(checkTransition({ ...base, from: 'received', to: 'washing' })).toEqual({
      ok: true,
      direction: 'forward',
    });
  });

  it('rejects skipping stages and staying put', () => {
    expect(checkTransition({ ...base, from: 'received', to: 'drying' })).toMatchObject({
      ok: false,
      code: 'skip_not_allowed',
    });
    expect(checkTransition({ ...base, from: 'washing', to: 'washing' })).toMatchObject({
      ok: false,
      code: 'same_status',
    });
  });

  it('requires a zero balance to release', () => {
    expect(
      checkTransition({ ...base, balanceCents: 1, from: 'ready_for_pickup', to: 'released' }),
    ).toMatchObject({ ok: false, code: 'balance_due' });
    expect(checkTransition({ ...base, from: 'ready_for_pickup', to: 'released' })).toMatchObject({
      ok: true,
    });
  });

  it('treats a completed transaction as closed, even for an admin', () => {
    const admin = { role: 'admin', balanceCents: 0, note: 'Customer came back' } as const;
    expect(checkTransition({ ...admin, from: 'released', to: 'ready_for_pickup' })).toMatchObject({
      ok: false,
      code: 'already_completed',
      message: 'This transaction is completed.',
    });
  });

  it('only allows other stages while a balance is due', () => {
    expect(
      checkTransition({ ...base, balanceCents: 500, from: 'washing', to: 'drying' }),
    ).toMatchObject({
      ok: true,
    });
  });

  it('blocks staff from reverting', () => {
    expect(checkTransition({ ...base, from: 'drying', to: 'washing', note: 'oops' })).toMatchObject(
      {
        ok: false,
        code: 'revert_not_allowed',
      },
    );
  });

  it('lets an admin revert one step with a reason', () => {
    const admin = { role: 'admin', balanceCents: 0 } as const;
    expect(checkTransition({ ...admin, from: 'drying', to: 'washing' })).toMatchObject({
      ok: false,
      code: 'revert_reason_required',
    });
    expect(checkTransition({ ...admin, from: 'drying', to: 'washing', note: '   ' })).toMatchObject(
      {
        ok: false,
        code: 'revert_reason_required',
      },
    );
    expect(
      checkTransition({ ...admin, from: 'drying', to: 'washing', note: 'Wrong load' }),
    ).toEqual({
      ok: true,
      direction: 'revert',
    });
    expect(checkTransition({ ...admin, from: 'folding', to: 'washing', note: 'x' })).toMatchObject({
      ok: false,
      code: 'revert_not_allowed',
    });
  });
});
