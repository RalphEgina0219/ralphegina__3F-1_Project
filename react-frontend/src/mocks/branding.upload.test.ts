// @vitest-environment node
// Uploads are multipart. Node's FormData, File and fetch agree with each other (jsdom's do not), so
// this file runs in plain Node with a small in-memory storage.
import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  const store = () => {
    const data = new Map<string, string>();
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, String(value)),
      removeItem: (key: string) => void data.delete(key),
      clear: () => data.clear(),
      key: (index: number) => [...data.keys()][index] ?? null,
      get length() {
        return data.size;
      },
    };
  };
  Object.assign(globalThis, { localStorage: store(), sessionStorage: store() });
});

import { db } from './db';
import { http, login, startMockApiForTests } from './test-utils';

startMockApiForTests();

const send = async (kind: string, file: File) => {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`http://localhost/api/settings/branding/${kind}`, {
    method: 'POST',
    body,
  });
  return { status: response.status, data: await response.json() };
};

describe('uploading a logo to the mock API', () => {
  it('stores a PNG, refuses SVG and oversize files, and resets to the defaults', async () => {
    await login('liza.ramos');
    const png = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'logo.png', {
      type: 'image/png',
    });
    const uploaded = await send('logo', png);
    expect(uploaded.status).toBe(200);
    expect(uploaded.data.logo_url).toMatch(/^data:image\/png;base64,/);
    expect(uploaded.data.icon_urls).not.toBeNull();

    const svg = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' });
    expect((await send('logo', svg)).status).toBe(422);
    const big = new File([new Uint8Array(2_200_000)], 'big.png', { type: 'image/png' });
    expect((await send('logo', big)).status).toBe(422);

    await http.put('/settings/branding', { system_name: 'Suds', basket_prefix: 'SUD' });
    const reset = await http.post('/settings/branding/reset');
    expect(reset.data).toMatchObject({
      system_name: 'LaundryFlow',
      basket_prefix: 'BSK',
      logo_url: null,
    });
    expect(db().audit_logs.at(-1)?.action).toBe('branding.reset');
  }, 30_000);
});
