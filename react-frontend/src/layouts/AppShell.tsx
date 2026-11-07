import { LayoutGrid, Menu, PlusCircle, ScanLine, WashingMachine } from 'lucide-react';
import { Suspense, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useMatches } from 'react-router-dom';
import { create } from 'zustand';
import { PageFallback } from '@/app/PageFallback';
import { Drawer } from '@/components/ui/Dialog';
import { Logo } from '@/components/ui/Logo';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { InstallBanner } from '@/features/pwa/components/InstallBanner';
import { rememberSide } from '@/features/pwa/side';
import { cn } from '@/lib/cn';
import { tabClass } from './nav';
import { SidebarContent } from './Sidebar';

interface UiState {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const useUiStore = create<UiState>((set) => ({
  drawerOpen: false,
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
}));

export interface RouteHandle {
  /** The page brings its own phone header and bottom actions, so the shell steps aside below md. */
  fullscreenOnPhone?: boolean;
}

function useFullscreenOnPhone() {
  const matches = useMatches();
  return matches.some((match) => (match.handle as RouteHandle | undefined)?.fullscreenOnPhone);
}

function TopBar({ hideOnPhone }: { hideOnPhone: boolean }) {
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen);
  return (
    <header
      className={cn(
        'on-dark pt-safe sticky top-0 z-20 bg-ink text-on-ink lg:hidden print:hidden',
        hideOnPhone && 'hidden md:block',
      )}
    >
      <div className="flex h-14 items-center gap-1 px-2">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="flex size-11 items-center justify-center rounded-control hover:bg-ink-3"
        >
          <Menu className="size-6" aria-hidden="true" />
        </button>
        <Link
          to="/"
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-control px-1"
        >
          <Logo className="size-8" />
          <span className="truncate text-base font-extrabold tracking-[-0.02em]">LaundryFlow</span>
        </Link>
        <NotificationBell variant="topbar" />
      </div>
      <WaveDivider
        className="absolute inset-x-0 top-full h-2.5 rotate-180 md:h-3"
        fill="fill-ink"
      />
    </header>
  );
}

function BottomTabs() {
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen);
  return (
    <nav
      aria-label="Quick navigation"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden print:hidden"
    >
      <div className="relative flex items-stretch">
        <NavLink to="/" end className={tabClass}>
          <LayoutGrid className="size-5.5" aria-hidden="true" />
          Home
        </NavLink>
        <NavLink to="/orders" end={false} className={tabClass}>
          <WashingMachine className="size-5.5" aria-hidden="true" />
          Orders
        </NavLink>
        <div className="flex-1" aria-hidden="true" />
        <NavLink to="/orders/new" className={tabClass}>
          <PlusCircle className="size-5.5" aria-hidden="true" />
          New
        </NavLink>
        <button
          type="button"
          className={tabClass({ isActive: false })}
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="size-5.5" aria-hidden="true" />
          More
        </button>
        <Link
          to="/scan"
          aria-label="Scan QR"
          className="absolute -top-5 left-1/2 flex size-15 -translate-x-1/2 items-center justify-center rounded-full border-4 border-surface bg-flow text-white shadow-md"
        >
          <ScanLine className="size-7" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}

export function AppShell() {
  const location = useLocation();
  const { drawerOpen, setDrawerOpen } = useUiStore();
  const fullscreenOnPhone = useFullscreenOnPhone();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => rememberSide('staff'), []);

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo(0, 0);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // After a route change keyboard and screen-reader users continue from the new page's content.
    // The delay lets a closing drawer finish returning focus first, so this has the last word.
    const timer = window.setTimeout(() => mainRef.current?.focus({ preventScroll: true }), 50);
    return () => window.clearTimeout(timer);
  }, [location.pathname, setDrawerOpen]);

  return (
    <div className="min-h-dvh lg:pl-60 print:pl-0">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-surface px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 lg:block print:hidden">
        <SidebarContent />
      </aside>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Menu">
        <SidebarContent onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      <TopBar hideOnPhone={fullscreenOnPhone} />
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className={cn(
          'mx-auto max-w-375 px-4 pt-8 outline-none md:px-6 md:pb-8 lg:px-8 lg:pt-7 print:p-0',
          // A full-screen phone page has no top bar, so it starts below the status bar itself.
          fullscreenOnPhone ? 'pb-8 max-md:pt-safe' : 'pb-[calc(96px+env(safe-area-inset-bottom))]',
        )}
      >
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      {!fullscreenOnPhone && (
        <>
          <BottomTabs />
          <InstallBanner className="bottom-[calc(76px+env(safe-area-inset-bottom))]" />
        </>
      )}
    </div>
  );
}
