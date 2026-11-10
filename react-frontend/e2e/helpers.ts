import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, test, type Page } from '@playwright/test';

/** What Chrome DevTools › Application › Manifest lists under "Installability". */
export async function installabilityErrors(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { installabilityErrors: errors } = await cdp.send('Page.getInstallabilityErrors');
    return errors.map((error) => error.errorId);
  } finally {
    await cdp.detach();
  }
}

/**
 * Installability as an ordinary Chrome profile sees it. Playwright's usual contexts are incognito,
 * where Chrome never offers installation ("in-incognito"), so this opens a throwaway real profile.
 */
export async function installabilityInProfile(url: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'laundryflow-pwa-'));
  const context = await chromium.launchPersistentContext(dir, { channel: 'chrome' });
  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(url);
    await waitForControllingWorker(page);
    return {
      installability: await installabilityErrors(page),
      manifest: await manifestErrors(page),
    };
  } finally {
    await context.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Manifest parse errors, as DevTools shows them at the top of the Manifest pane. */
export async function manifestErrors(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { errors } = await cdp.send('Page.getAppManifest');
    return errors.filter((error) => error.critical).map((error) => error.message);
  } finally {
    await cdp.detach();
  }
}

/** Script URLs of every registered service worker on this origin. */
export function workerScripts(page: Page) {
  return page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.map(
      (registration) =>
        (registration.active ?? registration.waiting ?? registration.installing)?.scriptURL ?? '',
    );
  });
}

/** Waits until a service worker is active and this page is under its control. */
export async function waitForControllingWorker(page: Page) {
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.ready).active));
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  }
}

/** Fires the event Chrome sends when the app can be installed, with a stub prompt. */
export function offerInstall(page: Page) {
  return page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
    });
    window.dispatchEvent(event);
  });
}

/**
 * Makes the page believe it runs as the installed app: `(display-mode: standalone)` matches.
 * An init script, so it holds from the first line of the app's code.
 */
export async function emulateStandalone(page: Page) {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      if (!/display-mode:\s*standalone/.test(query)) return original(query);
      const noop = () => {};
      return {
        matches: true,
        media: query,
        onchange: null,
        addEventListener: noop,
        removeEventListener: noop,
        addListener: noop,
        removeListener: noop,
        dispatchEvent: () => false,
      } as unknown as MediaQueryList;
    };
  });
}

/** The contract project runs the same specs against the Laravel API instead of the mock. */
export const againstRealApi = () => test.info().project.name === 'contract';

/**
 * Signs in without the form. Against the mock: its session key. Against Laravel: a real JWT from
 * POST /api/v1/auth/login, stored where the app keeps it.
 */
async function signInAs(page: Page, username: string, mockId: string) {
  await page.goto('/login');
  if (!againstRealApi()) {
    await page.evaluate((id) => localStorage.setItem('laundryflow.mock.session', id), mockId);
    return;
  }
  const response = await page.request.post('/api/v1/auth/login', {
    data: { username, password: 'password123' },
    headers: { Accept: 'application/json' },
  });
  const { data } = (await response.json()) as { data: { access_token: string } };
  await page.evaluate(
    (token) => localStorage.setItem('laundryflow.token.staff', token),
    data.access_token,
  );
}

/** The shop owner (liza.ramos). */
export const asOwner = (page: Page) => signInAs(page, 'liza.ramos', '1');

/** A staff member (kevin.m). */
export const asStaffMember = (page: Page) => signInAs(page, 'kevin.m', '2');

/** Width and height from a PNG's IHDR header. */
export function pngSize(bytes: Buffer) {
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
