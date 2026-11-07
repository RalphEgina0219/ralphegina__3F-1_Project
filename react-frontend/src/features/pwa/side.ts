const KEY = 'laundryflow.last-side';

export type AppSide = 'staff' | 'customer';

/**
 * The installed app has one start URL, "/", which is the staff dashboard. A customer who installed
 * it from their account should land back there, so the device remembers which side it last used.
 */
export function rememberSide(side: AppSide) {
  try {
    localStorage.setItem(KEY, side);
  } catch {
    // Storage blocked: "/" leads to the staff sign-in, which links to the customer one.
  }
}

export function lastSide(): AppSide | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'staff' || value === 'customer' ? value : null;
  } catch {
    return null;
  }
}
