import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { useInstallPrompt } from '../install';
import { dismissInstallBanner, installBannerDismissed, visitCount } from '../visits';
import { IosInstallGuide } from './IosInstallGuide';

/**
 * A one-time suggestion on phones, from the second visit on, just above the bottom tabs.
 * Dismissing it, or tapping Install, hides it for good on this device.
 */
export function InstallBanner({ className }: { className?: string }) {
  const isPhone = useMediaQuery('(max-width: 767px)');
  const { available, canInstall, promptInstall } = useInstallPrompt();
  const [hidden, setHidden] = useState(() => installBannerDismissed() || visitCount() < 2);
  const [guideOpen, setGuideOpen] = useState(false);

  const dismiss = () => {
    dismissInstallBanner();
    setHidden(true);
  };

  const guide = <IosInstallGuide open={guideOpen} onOpenChange={setGuideOpen} />;
  if (!isPhone || hidden || !available) return guide;

  return (
    <>
      <aside
        aria-label="Install LaundryFlow"
        className={cn(
          'fixed inset-x-3 z-30 flex items-center gap-2 rounded-card border border-line bg-surface py-1.5 pr-1.5 pl-3 shadow-lg md:hidden print:hidden',
          className,
        )}
      >
        <Logo className="size-9" />
        <p className="min-w-0 flex-1 text-[13px] leading-snug font-semibold">
          Install LaundryFlow for quicker access.
        </p>
        <Button
          size="compact"
          className="px-3"
          onClick={() => {
            dismiss();
            if (canInstall) void promptInstall();
            else setGuideOpen(true);
          }}
        >
          Install
        </Button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="flex size-11 shrink-0 items-center justify-center rounded-control text-muted hover:bg-foam"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </aside>
      {guide}
    </>
  );
}
