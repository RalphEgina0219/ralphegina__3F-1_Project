import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { PublicHeader } from '@/layouts/PublicHeader';

/** Wave header and one card: the frame of the customer sign-in, registration and password pages. */
export function PortalAuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <PublicHeader
        homeTo="/my"
        aside={<span className="text-[13px] text-on-ink-muted">My laundry</span>}
      >
        <h1 className="mt-4 text-[28px] leading-tight font-extrabold tracking-[-0.02em] text-on-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-on-ink-muted">{subtitle}</p>}
      </PublicHeader>
      <main className="mx-auto max-w-xl px-4 pt-2 pb-10">
        <Card className="p-5">{children}</Card>
        {footer && <div className="mt-4 space-y-2 text-center text-sm">{footer}</div>}
      </main>
    </>
  );
}
