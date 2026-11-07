/**
 * Data this device keeps between visits that names customers or orders. It goes when anyone signs
 * out or a session ends, so the next person on a shared shop phone starts clean.
 */
const PRIVATE_KEYS = ['laundryflow.recent-scans.v2', 'laundryflow.recent-scans'];

const cleanups = new Set<() => void>();

/** In-memory stores that mirror private storage register here to be emptied too. */
export function onPrivateDataCleared(cleanup: () => void) {
  cleanups.add(cleanup);
}

export function clearPrivateDeviceData() {
  cleanups.forEach((cleanup) => cleanup());
  for (const key of PRIVATE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage can be blocked (private mode, site settings): then nothing was kept either.
    }
  }
}
