import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const Dropdown = RadixDropdown.Root;
export const DropdownTrigger = RadixDropdown.Trigger;

export function DropdownContent({
  className,
  align = 'end',
  children,
  ...props
}: ComponentProps<typeof RadixDropdown.Content>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align={align}
        sideOffset={6}
        className={cn(
          'z-50 min-w-48 rounded-control border border-line bg-surface p-1 shadow-lg data-[state=open]:animate-pop-in',
          className,
        )}
        {...props}
      >
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  );
}

export function DropdownItem({
  className,
  icon,
  children,
  ...props
}: ComponentProps<typeof RadixDropdown.Item> & { icon?: ReactNode }) {
  return (
    <RadixDropdown.Item
      className={cn(
        'flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-text outline-none select-none',
        'data-disabled:opacity-50 data-highlighted:bg-flow-soft',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </RadixDropdown.Item>
  );
}
