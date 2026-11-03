import { Search } from 'lucide-react';
import { useId, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { useCustomers } from '@/features/customers/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/cn';
import { formatPhone } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import type { CustomerDto } from '@/types/api';

interface CustomerComboboxProps {
  id?: string;
  onSelect: (customer: CustomerDto) => void;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

export function CustomerCombobox({ id, onSelect, ...aria }: CustomerComboboxProps) {
  const listId = useId();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const debounced = useDebouncedValue(text, 200);
  const query = useCustomers({ search: debounced, per_page: 6 });
  const options = query.data?.data ?? [];
  const showList = open && debounced === text;

  const choose = (customer: CustomerDto) => {
    onSelect(customer);
    setText('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        {...aria}
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && options[active] ? `${listId}-${active}` : undefined}
        placeholder="Name or contact number"
        autoComplete="off"
        icon={<Search className="size-4" aria-hidden="true" />}
        value={text}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setText(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setActive((current) => Math.min(current + 1, options.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
          } else if (event.key === 'Enter' && showList) {
            event.preventDefault();
            const option = options[active];
            if (option) choose(option);
          } else if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      <ul
        id={listId}
        role="listbox"
        aria-label="Matching customers"
        className={cn(
          'absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-control border border-line bg-surface p-1 shadow-lg',
          !showList && 'hidden',
        )}
      >
        {options.length === 0 && (
          <li role="presentation" className="px-3 py-3 text-sm text-muted">
            {query.isFetching ? 'Searching…' : 'No customer found. Add them as new.'}
          </li>
        )}
        {options.map((customer, index) => (
          // Keyboard selection is handled on the combobox input, per the ARIA combobox pattern.
          <li
            key={customer.id}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            className={cn(
              'flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-1.5',
              index === active && 'bg-flow-soft',
            )}
            onMouseEnter={() => setActive(index)}
            // Selecting on mouse down keeps the input from blurring and closing the list first.
            onMouseDown={(event) => {
              event.preventDefault();
              choose(customer);
            }}
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold">{customer.full_name}</span>
              <span className="block text-[13px] text-muted">
                {formatPhone(customer.contact_number)} · {customer.barangay_name}
              </span>
            </span>
            {customer.balance_cents > 0 && (
              <span className="shrink-0 text-[13px] font-semibold text-warn">
                {formatMoney(customer.balance_cents)} due
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
