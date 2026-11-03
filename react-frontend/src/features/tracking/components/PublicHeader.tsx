import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import { WaveDivider } from '@/components/ui/WaveDivider';

export function PublicHeader({ children, overlap }: { children?: ReactNode; overlap?: boolean }) {
  return (
    <header className={overlap ? 'bg-ink text-on-ink' : 'bg-ink pb-1 text-on-ink'}>
      <div className="mx-auto max-w-xl px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo className="size-9" />
            <span className="text-lg font-extrabold tracking-[-0.02em]">LaundryFlow</span>
          </div>
          <span className="text-[13px] text-on-ink-muted">Order tracking</span>
        </div>
        {children}
      </div>
      <WaveDivider className="h-9" />
    </header>
  );
}
