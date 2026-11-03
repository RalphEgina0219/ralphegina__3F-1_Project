import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { controlClass } from './Input';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  'aria-label'?: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, onValueChange, options, placeholder = 'Select…', disabled, className, name, ...trigger },
  ref,
) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled} name={name}>
      <RadixSelect.Trigger
        ref={ref}
        className={cn(
          controlClass,
          'inline-flex items-center justify-between gap-2 text-left text-base font-medium md:text-sm',
          'data-placeholder:text-muted',
          className,
        )}
        {...trigger}
      >
        <span className="truncate">
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        <RadixSelect.Icon>
          <ChevronDown className="size-4 text-muted" aria-hidden="true" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-72 w-(--radix-select-trigger-width) min-w-40 overflow-hidden rounded-control border border-line bg-surface shadow-lg"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  'relative flex min-h-11 items-center rounded-md py-2 pr-8 pl-3 text-sm outline-none select-none',
                  'data-disabled:opacity-50 data-highlighted:bg-flow-soft data-highlighted:text-flow-hover',
                )}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-2">
                  <Check className="size-4" aria-hidden="true" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
});
