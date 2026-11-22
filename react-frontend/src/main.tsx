import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from '@/app/providers';
import { bootstrapAuth } from '@/features/auth/store';
import { listenForInstallPrompt } from '@/features/pwa/install';
import { recordVisit } from '@/features/pwa/visits';
import { removeOtherWorkers } from '@/features/pwa/workers';
import { bootBranding } from '@/features/branding/BrandingProvider';
import { currentTheme } from '@/lib/theme';
import './index.css';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/**
 * Exactly one service worker owns "/":
 * - mocks on (dev and the demo build): MSW's worker, which serves the mock API. No offline cache.
 * - mocks off (real API): the Workbox worker with the offline app shell. MSW is not bundled.
 */
const ServiceWorkerUpdates = USE_MOCKS
  ? null
  : lazy(() => import('@/features/pwa/components/ServiceWorkerUpdates'));

const root = document.getElementById('root') as HTMLElement;

async function start() {
  // Before anything awaits: the browser may offer installation straight away.
  listenForInstallPrompt();
  recordVisit();
  await removeOtherWorkers(USE_MOCKS ? 'mock' : 'pwa');

  // The mock API is a separate chunk, so a production build with mocks off never downloads it.
  if (USE_MOCKS) {
    try {
      const { startMockApi } = await import('@/mocks/browser');
      await startMockApi();
    } catch {
      // Service workers need HTTPS or localhost, so a phone on http://192.168.x.x lands here.
      root.innerHTML = `<main style="max-width:30rem;margin:15vh auto;padding:0 1.25rem;text-align:center">
        <h1 style="font-size:1.5rem;font-weight:800">The demo cannot start on this address</h1>
        <p style="margin-top:.5rem">The mock API needs a secure connection. Open the app on <strong>localhost</strong> or over <strong>HTTPS</strong>.</p>
      </main>`;
      return;
    }
  }
  void bootstrapAuth();
  // The cached branding paints with the first frame: no flash of the default look.
  bootBranding(currentTheme());

  createRoot(root).render(
    <StrictMode>
      <Providers />
      {ServiceWorkerUpdates && (
        <Suspense fallback={null}>
          <ServiceWorkerUpdates />
        </Suspense>
      )}
    </StrictMode>,
  );
}

void start();
