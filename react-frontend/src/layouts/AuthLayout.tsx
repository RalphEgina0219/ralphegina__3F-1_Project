import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageFallback } from '@/app/PageFallback';
import { Logo } from '@/components/ui/Logo';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { cn } from '@/lib/cn';
import { STATUS_META, STATUS_ORDER } from '@/lib/status';

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-ink text-on-ink lg:flex lg:flex-col">
        <div className="relative z-10 flex-1 p-14">
          <div className="flex items-center gap-3">
            <Logo className="size-11" />
            <div>
              <p className="text-xl font-extrabold tracking-[-0.02em]">LaundryFlow</p>
              <p className="text-xs text-on-ink-muted">
                Laundry shop management · basket QR tracking
              </p>
            </div>
          </div>
          <p className="mt-10 max-w-md text-[42px] leading-[1.05] font-extrabold tracking-[-0.03em]">
            Every load, tracked from drop-off to pickup.
          </p>
          <p className="mt-4 max-w-md text-base text-on-ink-muted">
            Record orders, compute charges automatically, tag every load with a basket, and let
            customers follow their laundry in their own account.
          </p>
          <ol className="mt-8 space-y-3">
            {STATUS_ORDER.map((status, index) => (
              <li key={status} className="flex items-center gap-3 text-[15px]">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-[13px] font-bold',
                    status === 'released' ? 'bg-aqua text-ink' : STATUS_META[status].chip,
                  )}
                >
                  {index + 1}
                </span>
                {STATUS_META[status].label}
              </li>
            ))}
          </ol>
        </div>
        <WaveDivider className="h-24" fill="fill-ink-2" backFill="fill-ink-3" />
      </aside>

      <header className="bg-ink text-on-ink lg:hidden">
        <div className="px-5 pt-10 pb-2">
          <Logo className="size-14" />
          <p className="mt-4 text-[28px] font-extrabold tracking-[-0.02em]">LaundryFlow</p>
          <p className="text-sm text-on-ink-muted">Every load, tracked from drop-off to pickup.</p>
        </div>
        <WaveDivider className="h-10" />
      </header>

      <main className="flex flex-1 flex-col bg-foam">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
