import * as RadixTabs from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

export const tabListClass =
  'no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-card bg-foam-2 p-1';
const tabClass =
  'min-h-11 shrink-0 rounded-control px-4 text-sm font-semibold whitespace-nowrap text-text transition-colors';
const activeClass = 'bg-surface text-flow-text shadow-sm';

export const Tabs = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;

export function TabsList({ className, ...props }: ComponentProps<typeof RadixTabs.List>) {
  return <RadixTabs.List className={cn(tabListClass, className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        tabClass,
        'data-[state=active]:bg-surface data-[state=active]:text-flow-text data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

/** Route-driven tabs: real links, so each tab has a URL. */
export function NavTabs({
  label,
  items,
  className,
}: {
  label: string;
  items: readonly { to: string; label: string; end?: boolean }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn(tabListClass, className)}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(tabClass, 'inline-flex items-center', isActive && activeClass)
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
