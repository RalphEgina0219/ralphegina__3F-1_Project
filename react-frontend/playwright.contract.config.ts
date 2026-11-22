import { defineConfig } from '@playwright/test';

const VITE = 'node node_modules/vite/bin/vite.js';
export const CONTRACT_PORT = 4312;

/**
 * The contract run: the frontend's e2e specs against the Laravel API (not the mock).
 *
 * 1. Laravel is reseeded (php artisan migrate:fresh --seed) and served on 127.0.0.1:8000.
 * 2. The real-API build (VITE_USE_MOCKS=false) is served by `vite preview`, which proxies /api to it.
 *
 * Needs MySQL running and laravel-backend/.env configured (see laravel-backend/README.md).
 * CONTRACT_REUSE=1 keeps servers you started yourself (no reseed, no rebuild) while iterating.
 */
export default defineConfig({
  testDir: 'e2e',
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    channel: 'chrome',
    trace: 'retain-on-failure',
    baseURL: `http://localhost:${CONTRACT_PORT}`,
  },
  projects: [
    { name: 'contract', testMatch: /(analytics\.demo|contract)\.spec\.ts$/ },
    // `npm run screenshots:branding`: not part of the contract run.
    { name: 'shots', testMatch: /branding\.screenshots\.spec\.ts$/ },
  ],
  webServer: [
    {
      command:
        'php artisan migrate:fresh --seed --force && php artisan serve --host=127.0.0.1 --port=8000',
      cwd: '../laravel-backend',
      url: 'http://127.0.0.1:8000/up',
      reuseExistingServer: Boolean(process.env.CONTRACT_REUSE),
      timeout: 240_000,
    },
    {
      command: `${VITE} build --outDir dist-e2e/contract && ${VITE} preview --outDir dist-e2e/contract --port ${CONTRACT_PORT} --strictPort`,
      url: `http://localhost:${CONTRACT_PORT}`,
      // Always the php artisan serve started above, whatever laundryflow.test points at.
      env: { VITE_API_PROXY_TARGET: 'http://127.0.0.1:8000' },
      reuseExistingServer: Boolean(process.env.CONTRACT_REUSE),
      timeout: 240_000,
    },
  ],
});
