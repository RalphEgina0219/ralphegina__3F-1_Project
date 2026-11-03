import { describe, expect, it } from 'vitest';
import { checkMovement, onHand, signedQuantity, stockLevelPercent, stockStatus } from './inventory';

describe('stockStatus', () => {
  it('is critical at or under half the reorder level', () => {
    expect(stockStatus(2, 5)).toBe('critical');
    expect(stockStatus(2.5, 5)).toBe('critical');
  });

  it('is low at or under the reorder level', () => {
    expect(stockStatus(3.5, 4)).toBe('low');
    expect(stockStatus(50, 50)).toBe('low');
  });

  it('is ok above the reorder level', () => {
    expect(stockStatus(12, 5)).toBe('ok');
  });
});

describe('onHand', () => {
  it('sums signed movements without float drift', () => {
    expect(
      onHand([
        { type: 'in', quantity: 10 },
        { type: 'out', quantity: 6.5 },
        { type: 'out', quantity: 1.5 },
      ]),
    ).toBe(2);
    expect(
      onHand([
        { type: 'in', quantity: 0.1 },
        { type: 'in', quantity: 0.2 },
      ]),
    ).toBe(0.3);
  });

  it('treats adjustments as signed deltas', () => {
    expect(signedQuantity('adjust', -2)).toBe(-2);
    expect(
      onHand([
        { type: 'in', quantity: 5 },
        { type: 'adjust', quantity: -2 },
      ]),
    ).toBe(3);
  });
});

describe('checkMovement', () => {
  it('blocks a stock-out above on-hand', () => {
    expect(checkMovement('out', 3, 2)).toMatchObject({ ok: false });
    expect(checkMovement('out', 2, 2)).toEqual({ ok: true });
  });

  it('blocks adjustments below zero', () => {
    expect(checkMovement('adjust', -3, 2)).toMatchObject({ ok: false });
    expect(checkMovement('adjust', 0, 2)).toMatchObject({ ok: false });
    expect(checkMovement('adjust', -2, 2)).toEqual({ ok: true });
  });

  it('requires a positive quantity for stock-in', () => {
    expect(checkMovement('in', 0, 2)).toMatchObject({ ok: false });
  });
});

describe('stockLevelPercent', () => {
  it('is clamped between 0 and 100', () => {
    expect(stockLevelPercent(2, 5)).toBe(20);
    expect(stockLevelPercent(500, 5)).toBe(100);
    expect(stockLevelPercent(0, 0)).toBe(0);
  });
});
