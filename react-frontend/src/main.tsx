import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from '@/app/providers';
import { bootstrapAuth } from '@/features/auth/store';
import './index.css';

const root = document.getElementById('root') as HTMLElement;

async function start() {
  // The mock API is a separate chunk, so a production build with mocks off never downloads it.
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
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

  createRoot(root).render(
    <StrictMode>
      <Providers />
    </StrictMode>,
  );
}

void start();
