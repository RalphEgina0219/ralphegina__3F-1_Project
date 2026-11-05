import { describe, expect, it } from 'vitest';
import { basketSequence, formatBasketNumber, parseScanInput } from './basket';

const token = 'AbCdEfGhIjKlMnOpQrStUvWxYz012-_9';

describe('basket numbers', () => {
  it('pads the sequence and reads it back', () => {
    expect(formatBasketNumber(7)).toBe('BSK-0007');
    expect(formatBasketNumber(12345)).toBe('BSK-12345');
    expect(basketSequence('BSK-0030')).toBe(30);
  });
});

describe('parseScanInput', () => {
  it('reads a basket label URL from any host', () => {
    expect(parseScanInput(`https://shop.example/b/${token}`)).toEqual({
      kind: 'token',
      value: token,
    });
    expect(parseScanInput(`http://192.168.1.5:5173/b/${token}?x=1`)).toEqual({
      kind: 'token',
      value: token,
    });
  });

  it('reads a bare token, a typed basket number and a typed order number', () => {
    expect(parseScanInput(token)).toEqual({ kind: 'token', value: token });
    expect(parseScanInput(' bsk-7 ')).toEqual({ kind: 'basket_number', value: 'BSK-0007' });
    expect(parseScanInput('BSK-0030')).toEqual({ kind: 'basket_number', value: 'BSK-0030' });
    expect(parseScanInput(' lf-261031-0019 ')).toEqual({
      kind: 'order_number',
      value: 'LF-261031-0019',
    });
  });

  it('rejects anything else, including the retired receipt tracking links', () => {
    expect(parseScanInput('')).toBeNull();
    expect(parseScanInput('https://evil.example/login')).toBeNull();
    expect(parseScanInput(`https://shop.example/track/${token}`)).toBeNull();
    expect(parseScanInput('LF-1031-0019')).toBeNull();
    expect(parseScanInput(`https://shop.example/b/${token}extra`)).toBeNull();
  });
});
