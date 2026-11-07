import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { cn } from '@/lib/cn';

interface PublicHeaderProps {
  children?: ReactNode;
  /** Pulls the first card up into the wave. */
  overlap?: boolean;
  /** Right side of the top row: a tagline, or the customer's bell and navigation. */
  aside?: ReactNode;
  /** Where the logo leads. */
  homeTo?: string;
  /** The customer portal is wider than the sign-in pages on desktop. */
  wide?: boolean;
}

/** The ink header with the wave, shared by the customer portal, its sign-in pages and /b/:token. */
export function PublicHeader({ children, overlap, aside, homeTo, wide }: PublicHeaderProps) {
  const brand = (
    <>
      <Logo className="size-9" />
      <span className="text-lg font-extrabold tracking-[-0.02em]">LaundryFlow</span>
    </>
  );
  return (
    <header className={cn('on-dark pt-safe bg-ink text-on-ink', !overlap && 'pb-1')}>
      <div className={cn('mx-auto px-4 pt-4 pb-3 sm:px-5', wide ? 'max-w-5xl' : 'max-w-xl')}>
        <div className="flex min-h-11 items-center justify-between gap-3">
          {homeTo ? (
            <Link to={homeTo} className="flex min-h-11 items-center gap-2.5 rounded-control">
              {brand}
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">{brand}</div>
          )}
          {aside}
        </div>
        {children}
      </div>
      <WaveDivider className="h-9" />
    </header>
  );
}
