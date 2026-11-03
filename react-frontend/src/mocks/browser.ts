import { setupWorker } from 'msw/browser';
import { db, resetDb } from './db';
import { handlers } from './handlers';

export async function startMockApi() {
  db();
  await setupWorker(...handlers).start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

export { resetDb };
