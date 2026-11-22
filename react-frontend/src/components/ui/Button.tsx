import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/cn';
import { blockOfflineClick, OfflineHint } from './OfflineHint';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dashed';
export type ButtonSize = 'md' | 'lg' | 'icon' | 'compact';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-flow text-on-flow hover:bg-flow-hover',
  secondary: 'border border-line-strong bg-surface text-text hover:bg-foam',
  ghost: 'text-text hover:bg-foam-2',
  danger: 'bg-danger text-white hover:opacity-90',
  dashed: 'border border-dashed border-flow-line bg-flow-soft/60 text-flow-text hover:bg-flow-soft',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-[15px] md:min-h-11 md:text-sm',
  icon: 'size-11',
  compact: 'min-h-11 px-2 text-[13px]',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  /**
   * The button saves something on the server, so it cannot work offline. Defaults to true when
   * `loading` is passed: every button with a pending state is a server action. Pass false for
   * actions that must work offline, such as signing out.
   */
  needsNetwork?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    icon,
    className,
    children,
    disabled,
    type,
    needsNetwork,
    onClick,
    ...props
  },
  ref,
) {
  const online = useOnlineStatus();
  const blocked = !online && (needsNetwork ?? loading !== undefined) && !disabled;
  return (
    <OfflineHint blocked={blocked}>
      <button
        ref={ref}
        type={type ?? 'button'}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={blocked || undefined}
        className={buttonClass(variant, size, className)}
        onClick={blocked ? blockOfflineClick : onClick}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : icon}
        {children}
      </button>
    </OfflineHint>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}

/** Inline text link in the brand color. */
export const linkClass =
  'inline-flex min-h-11 items-center font-semibold text-flow-text underline underline-offset-2 hover:text-flow-hover';
