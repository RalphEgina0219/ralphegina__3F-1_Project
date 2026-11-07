import * as RadixSwitch from '@radix-ui/react-switch';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/cn';
import { blockOfflineClick, OfflineHint } from './OfflineHint';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
  /** Each flip saves straight to the server, so it waits for a connection. */
  needsNetwork?: boolean;
}

export function Switch({ className, needsNetwork = false, ...props }: SwitchProps) {
  const online = useOnlineStatus();
  const blocked = needsNetwork && !online && !props.disabled;
  return (
    <OfflineHint blocked={blocked}>
      <RadixSwitch.Root
        className={cn(
          // The visible track is 26 px tall; the button height gives a 44 px touch target.
          'group relative inline-flex h-11 w-12 shrink-0 items-center disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
          className,
        )}
        {...props}
        aria-disabled={blocked || undefined}
        onClick={blocked ? blockOfflineClick : undefined}
      >
        <span className="absolute inset-x-0 h-6.5 rounded-full bg-line-strong transition-colors group-data-[state=checked]:bg-flow" />
        <RadixSwitch.Thumb className="relative ml-0.75 block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5.5" />
      </RadixSwitch.Root>
    </OfflineHint>
  );
}
