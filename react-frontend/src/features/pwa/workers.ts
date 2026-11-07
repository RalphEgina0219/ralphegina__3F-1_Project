/**
 * A scope holds one service worker. Mock builds use MSW's worker and real-API builds use Workbox's,
 * so before either starts, the other mode's leftover worker goes (same origin, earlier deploy).
 */
const MOCK_WORKER = '/mockServiceWorker.js';

export async function removeOtherWorkers(keep: 'mock' | 'pwa') {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const stale = registrations.filter((registration) => {
      const worker = registration.active ?? registration.waiting ?? registration.installing;
      if (!worker) return false;
      const isMock = new URL(worker.scriptURL).pathname === MOCK_WORKER;
      return keep === 'mock' ? !isMock : isMock;
    });
    await Promise.all(stale.map((registration) => registration.unregister()));
    // The mock build caches nothing, so anything in Cache Storage is an old app shell.
    if (keep === 'mock' && 'caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch {
    // Blocked storage or an insecure origin: then there is no worker to remove either.
  }
}
