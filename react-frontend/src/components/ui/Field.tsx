import { type ReactNode, useId } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  /** Receives the id and description props to spread on the control. */
  children: (control: {
    id: string;
    'aria-invalid'?: true;
    'aria-describedby'?: string;
  }) => ReactNode;
}

/** Label, control, hint and error wired together for assistive technology. */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  const descriptionId = `${id}-desc`;
  const hasDescription = Boolean(error || hint);
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-text">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children({
        id,
        ...(error ? { 'aria-invalid': true as const } : {}),
        ...(hasDescription ? { 'aria-describedby': descriptionId } : {}),
      })}
      {hasDescription && (
        <p
          id={descriptionId}
          className={cn('mt-1.5 text-[13px]', error ? 'font-medium text-danger' : 'text-muted')}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
