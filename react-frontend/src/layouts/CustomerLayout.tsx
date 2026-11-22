import { Home, ListOrdered, UserRound } from 'lucide-react';
import { Suspense, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { PageFallback } from '@/app/PageFallback';
import { CustomerNotificationBell } from '@/features/portal/components/CustomerNotificationBell';
import { InstallBanner } from '@/features/pwa/components/InstallBanner';
import { rememberSide } from '@/features/pwa/side';
import { cn } from '@/lib/cn';
import { tabClass } from './nav';
import { PoweredBy } from '@/features/branding/PoweredBy';
import { PublicHeader } from './PublicHeader';

const LINKS = [
  { to: '/my', label: 'Home', icon: Home, end: true },
  { to: '/my/orders', label: 'Orders', icon: ListOrdered, end: false },
  { to: '/my/account', label: 'Account', icon: UserRound, end: true },
] as const;

/**
 * The customer portal: same tokens, logo and wave header as the rest of the public side.
 * A top nav on desktop and bottom tabs on phones. Staff navigation never appears here.
 */
export function CustomerLayout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => rememberSide('customer'), []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-foam">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-surface px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <PublicHeader
        wide
        homeTo="/my"
        aside={
          <div className="flex items-center gap-1">
            <nav aria-label="My account" className="hidden items-center gap-1 md:flex">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center rounded-control px-3 text-sm font-semibold',
                      isActive
                        ? 'bg-ink-3 text-on-ink'
                        : 'text-on-ink-muted hover:bg-ink-3 hover:text-on-ink',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <CustomerNotificationBell />
          </div>
        }
      />
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto max-w-5xl px-4 pt-1 pb-[calc(88px+env(safe-area-inset-bottom))] outline-none sm:px-5 md:pb-10"
      >
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
        <PoweredBy className="pb-24 text-muted md:pb-6" />
      </main>
      <nav
        aria-label="My account"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden"
      >
        <div className="flex items-stretch">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={tabClass}>
              <link.icon className="size-5.5" aria-hidden="true" />
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <InstallBanner className="bottom-[calc(64px+env(safe-area-inset-bottom))]" />
    </div>
  );
}
