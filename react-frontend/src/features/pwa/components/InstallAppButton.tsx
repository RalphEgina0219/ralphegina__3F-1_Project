import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useInstallPrompt } from '../install';
import { IosInstallGuide } from './IosInstallGuide';

interface InstallAppButtonProps {
  /** `sidebar`: a row in the dark staff sidebar. `link`: a quiet text link. `button`: a full button. */
  variant: 'sidebar' | 'link' | 'button';
  className?: string;
}

/**
 * "Install app": the browser's install dialog where there is one, the Share-sheet guide on iPhone.
 * Renders nothing when already running as the installed app, or when the browser can't install.
 */
export function InstallAppButton({ variant, className }: InstallAppButtonProps) {
  const { available, canInstall, promptInstall } = useInstallPrompt();
  const [guideOpen, setGuideOpen] = useState(false);
  if (!available && !guideOpen) return null;

  const onClick = () => (canInstall ? void promptInstall() : setGuideOpen(true));
  const icon = <Download className="size-4.5 shrink-0" aria-hidden="true" />;

  return (
    <>
      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-sm font-semibold text-on-ink-muted transition-colors hover:bg-ink-3 hover:text-on-ink',
            className,
          )}
        >
          {icon}
          Install app
        </button>
      )}
      {variant === 'link' && (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold text-flow underline underline-offset-2 hover:text-flow-hover',
            className,
          )}
        >
          {icon}
          Install app
        </button>
      )}
      {variant === 'button' && (
        <Button variant="secondary" icon={icon} onClick={onClick} className={className}>
          Install app
        </Button>
      )}
      <IosInstallGuide open={guideOpen} onOpenChange={setGuideOpen} />
    </>
  );
}
