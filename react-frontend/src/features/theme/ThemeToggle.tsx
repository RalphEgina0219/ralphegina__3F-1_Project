import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTheme } from './ThemeProvider';

/**
 * The one light/dark switch of an interface. Each interface (staff app, customer portal, sign-in
 * pages) renders it exactly once, in its top bar or top-right corner.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button
      type="button"
      data-testid="theme-toggle"
      aria-label={label}
      title={label}
      onClick={toggle}
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-control hover:bg-foam-2 focus-visible:outline-2 focus-visible:outline-flow',
        className,
      )}
    >
      {theme === 'dark' ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
