import { defineConfig } from '@playwright/test';

const VITE = 'node node_modules/vite/bin/vite.js';
export const DEMO_PORT = 4310;
export const REAL_PORT = 4311;

/**
 * Two production builds, each served by `vite preview`:
 * - demo (mocks on): MSW's worker only, the full app against the in-browser mock API.
 * - real (mocks off): the Workbox worker and the offline app shell. There is no API behind it, so
 *   these tests stay on screens that need none (sign-in, registration, offline fallback).
 *
 * Uses the installed Google Chrome, so no browser download is needed.
 */
export default defineConfig({
  testDir: 'e2e',
  // One browser at a time: the real-build tests rewrite dist-e2e/real/sw.js to simulate an update.
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: { channel: 'chrome', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'demo',
      testMatch: /demo\.spec\.ts$/,
      use: { baseURL: `http://localhost:${DEMO_PORT}` },
    },
    {
      name: 'real',
      testMatch: /real\.spec\.ts$/,
      use: { baseURL: `http://localhost:${REAL_PORT}` },
    },
    {
      // `npm run screenshots`: refreshes public/screenshots for the install dialog.
      name: 'screenshots',
      testMatch: /screenshots\.spec\.ts$/,
      use: { baseURL: `http://localhost:${DEMO_PORT}` },
    },
  ],
  webServer: [
    {
      command: `${VITE} build --mode demo --outDir dist-e2e/demo && ${VITE} preview --mode demo --outDir dist-e2e/demo --port ${DEMO_PORT} --strictPort`,
      url: `http://localhost:${DEMO_PORT}`,
      reuseExistingServer: false,
      timeout: 240_000,
    },
    {
      command: `${VITE} build --outDir dist-e2e/real && ${VITE} preview --outDir dist-e2e/real --port ${REAL_PORT} --strictPort`,
      url: `http://localhost:${REAL_PORT}`,
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
