import * as RadixSwitch from '@radix-ui/react-switch';
import { cn } from '@/lib/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <RadixSwitch.Root
      className={cn(
        // The visible track is 26 px tall; the button height gives a 44 px touch target.
        'group relative inline-flex h-11 w-12 shrink-0 items-center disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute inset-x-0 h-6.5 rounded-full bg-line-strong transition-colors group-data-[state=checked]:bg-flow" />
      <RadixSwitch.Thumb className="relative ml-0.75 block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5.5" />
    </RadixSwitch.Root>
  );
}
