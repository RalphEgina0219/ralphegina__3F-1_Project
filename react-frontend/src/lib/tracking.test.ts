import { describe, expect, it } from 'vitest';
import { parseScannedCode } from './tracking';

const token = 'AbCdEfGhIjKlMnOpQrStUvWxYz012-_9';

describe('parseScannedCode', () => {
  it('reads a tracking URL from any host', () => {
    expect(parseScannedCode(`https://shop.example/track/${token}`)).toEqual({ token });
    expect(parseScannedCode(`http://192.168.1.5:5173/track/${token}?x=1`)).toEqual({ token });
  });

  it('reads a bare token and a typed order number', () => {
    expect(parseScannedCode(token)).toEqual({ token });
    expect(parseScannedCode(' lf-261031-0019 ')).toEqual({ order_number: 'LF-261031-0019' });
  });

  it('rejects anything else', () => {
    expect(parseScannedCode('')).toBeNull();
    expect(parseScannedCode('https://evil.example/login')).toBeNull();
    expect(parseScannedCode('LF-1031-0019')).toBeNull();
    expect(parseScannedCode(`https://shop.example/track/${token}extra`)).toBeNull();
  });
});
