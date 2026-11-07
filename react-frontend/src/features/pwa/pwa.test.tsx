import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '@/components/ui/Button';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { isIos } from '@/lib/platform';
import { clearPrivateDeviceData, onPrivateDataCleared } from '@/lib/session';
import { hasUnsavedChanges, useUnsavedChanges } from '@/lib/unsaved';
import { listenForInstallPrompt, useInstallPrompt, useInstallStore } from './install';
import { recordVisit, visitCount } from './visits';
import { removeOtherWorkers } from './workers';

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
  window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

function stubMatchMedia(matching: string[] = []) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matching.some((m) => query.includes(m)),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => stubMatchMedia());
afterEach(() => {
  act(() => setOnline(true));
  vi.unstubAllGlobals();
  useInstallStore.setState({ deferred: null, installed: false });
  localStorage.clear();
  sessionStorage.clear();
});

describe('useOnlineStatus', () => {
  it('follows the browser online and offline events', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
    act(() => setOnline(false));
    expect(result.current).toBe(false);
    act(() => setOnline(true));
    expect(result.current).toBe(true);
  });
});

describe('Button offline', () => {
  it('blocks a server action offline, keeps it focusable and explains why', () => {
    const onClick = vi.fn();
    render(
      <Button loading={false} onClick={onClick}>
        Save order
      </Button>,
    );
    act(() => setOnline(false));
    const button = screen.getByRole('button', { name: 'Save order' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    act(() => setOnline(true));
    expect(screen.getByRole('button', { name: 'Save order' })).not.toHaveAttribute('aria-disabled');
    fireEvent.click(screen.getByRole('button', { name: 'Save order' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('blocks form submission through the submit button too', () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
        <Button type="submit" loading={false}>
          Record payment
        </Button>
      </form>,
    );
    act(() => setOnline(false));
    fireEvent.click(screen.getByRole('button', { name: 'Record payment' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('leaves ordinary buttons and opted-out actions (sign out) working', () => {
    const cancel = vi.fn();
    const signOut = vi.fn();
    render(
      <>
        <Button onClick={cancel}>Cancel</Button>
        <Button loading={false} needsNetwork={false} onClick={signOut}>
          Sign out
        </Button>
      </>,
    );
    act(() => setOnline(false));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(cancel).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledOnce();
  });
});

describe('install prompt', () => {
  function offer() {
    const prompt = vi.fn(async () => {});
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });
    act(() => {
      window.dispatchEvent(event);
    });
    return { event, prompt };
  }

  it('captures the browser offer, prompts once, and forgets it', async () => {
    listenForInstallPrompt();
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);

    const { event, prompt } = offer();
    expect(event.defaultPrevented).toBe(true);
    expect(result.current.canInstall).toBe(true);

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });
    expect(prompt).toHaveBeenCalledOnce();
    expect(outcome).toBe('accepted');
    expect(result.current.canInstall).toBe(false);
  });

  it('offers nothing when already running as the installed app', () => {
    stubMatchMedia(['display-mode: standalone']);
    listenForInstallPrompt();
    const { result } = renderHook(() => useInstallPrompt());
    offer();
    expect(result.current).toMatchObject({ canInstall: false, available: false });
  });

  it('reads display mode from the media query and from iOS navigator.standalone', () => {
    expect(renderHook(() => useDisplayMode()).result.current.standalone).toBe(false);
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
    expect(renderHook(() => useDisplayMode()).result.current.standalone).toBe(true);
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: undefined });
  });

  it('recognises iPhone, iPad (which reports a Mac) and not Android', () => {
    expect(isIos('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 5)).toBe(true);
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true);
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false);
    expect(isIos('Mozilla/5.0 (Linux; Android 15; Pixel 9)', 5)).toBe(false);
  });

  it('counts one visit per browser session', () => {
    recordVisit();
    recordVisit();
    expect(visitCount()).toBe(1);
    sessionStorage.clear();
    recordVisit();
    expect(visitCount()).toBe(2);
  });
});

describe('unsaved changes', () => {
  it('is true only while a dirty form is mounted', () => {
    const { rerender, unmount } = renderHook(({ dirty }) => useUnsavedChanges(dirty), {
      initialProps: { dirty: false },
    });
    expect(hasUnsavedChanges()).toBe(false);
    rerender({ dirty: true });
    expect(hasUnsavedChanges()).toBe(true);
    unmount();
    expect(hasUnsavedChanges()).toBe(false);
  });
});

describe('signing out on a shared device', () => {
  it('empties registered stores and removes private keys', () => {
    const cleanup = vi.fn();
    onPrivateDataCleared(cleanup);
    localStorage.setItem('laundryflow.recent-scans.v2', '{"state":{"scans":[1]}}');
    localStorage.setItem('laundryflow.install-banner-dismissed', '1');
    clearPrivateDeviceData();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(localStorage.getItem('laundryflow.recent-scans.v2')).toBeNull();
    // Not private: kept.
    expect(localStorage.getItem('laundryflow.install-banner-dismissed')).toBe('1');
  });
});

describe('one service worker per scope', () => {
  function registration(script: string) {
    return {
      active: { scriptURL: `https://shop.test${script}` },
      waiting: null,
      installing: null,
      unregister: vi.fn(async () => true),
    };
  }

  function stubWorkers(...scripts: string[]) {
    const registrations = scripts.map(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistrations: async () => registrations },
    });
    const deleted: string[] = [];
    vi.stubGlobal('caches', {
      keys: async () => ['workbox-precache-v2-https://shop.test/', 'images'],
      delete: async (name: string) => deleted.push(name) > 0,
    });
    return { registrations, deleted };
  }

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  it('mock mode removes a Workbox worker and its caches, keeps MSW', async () => {
    const { registrations, deleted } = stubWorkers('/sw.js', '/mockServiceWorker.js');
    await removeOtherWorkers('mock');
    expect(registrations[0]?.unregister).toHaveBeenCalled();
    expect(registrations[1]?.unregister).not.toHaveBeenCalled();
    expect(deleted).toEqual(['workbox-precache-v2-https://shop.test/', 'images']);
  });

  it('real-API mode removes the MSW worker, keeps Workbox and its caches', async () => {
    const { registrations, deleted } = stubWorkers('/sw.js', '/mockServiceWorker.js');
    await removeOtherWorkers('pwa');
    expect(registrations[0]?.unregister).not.toHaveBeenCalled();
    expect(registrations[1]?.unregister).toHaveBeenCalled();
    expect(deleted).toEqual([]);
  });
});
