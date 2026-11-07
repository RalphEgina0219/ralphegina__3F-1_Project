const VISITS = 'laundryflow.visits';
const COUNTED = 'laundryflow.visit-counted';
const BANNER_DISMISSED = 'laundryflow.install-banner-dismissed';

/** Counts one visit per browser session. Every access is wrapped: storage can be blocked. */
export function recordVisit() {
  try {
    if (sessionStorage.getItem(COUNTED)) return;
    sessionStorage.setItem(COUNTED, '1');
    localStorage.setItem(VISITS, String(visitCount() + 1));
  } catch {
    // No storage: the install banner simply never shows.
  }
}

export function visitCount(): number {
  try {
    return Number(localStorage.getItem(VISITS)) || 0;
  } catch {
    return 0;
  }
}

export function installBannerDismissed(): boolean {
  try {
    return localStorage.getItem(BANNER_DISMISSED) === '1';
  } catch {
    return true;
  }
}

export function dismissInstallBanner() {
  try {
    localStorage.setItem(BANNER_DISMISSED, '1');
  } catch {
    // Not remembered, but it still hides for this page view.
  }
}
