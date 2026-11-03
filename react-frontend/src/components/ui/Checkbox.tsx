import { Check } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
}

/** Native checkbox with a 44 px hit area. Without `label`, pass an `aria-label`. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, ...props },
  ref,
) {
  return (
    <label
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center gap-3',
        props.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative inline-flex size-5.5 shrink-0 items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          className="peer absolute inset-0 m-0 cursor-[inherit] appearance-none rounded-md border border-line-strong bg-surface checked:border-flow checked:bg-flow"
          {...props}
        />
        <Check
          className="pointer-events-none relative hidden size-4 text-white peer-checked:block"
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block font-medium text-text">{label}</span>}
          {description && <span className="block text-[13px] text-muted">{description}</span>}
        </span>
      )}
    </label>
  );
});
