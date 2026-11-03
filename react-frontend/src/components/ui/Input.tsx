import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const controlClass = cn(
  'min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-text',
  'placeholder:text-muted disabled:cursor-not-allowed disabled:bg-foam disabled:text-muted',
  'aria-invalid:border-danger',
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, icon, wrapperClassName, ...props },
  ref,
) {
  if (!icon) return <input ref={ref} className={cn(controlClass, className)} {...props} />;
  return (
    <div className={cn('relative', wrapperClassName)}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
        {icon}
      </span>
      <input ref={ref} className={cn(controlClass, 'pl-10', className)} {...props} />
    </div>
  );
});
