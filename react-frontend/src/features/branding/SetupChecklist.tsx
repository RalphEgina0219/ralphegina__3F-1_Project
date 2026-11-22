import { Check, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { useBrandingAdmin, useTickSetupItem } from './api';

/**
 * The owner's first-login checklist: logo and colors, shop details, rates, soaps, staff, basket
 * labels. Some items complete themselves; the rest the owner ticks. It disappears when all are done.
 */
export function SetupChecklist() {
  const query = useBrandingAdmin();
  const tick = useTickSetupItem();
  const items = query.data?.setup_checklist ?? [];
  if (items.length === 0 || items.every((item) => item.done)) return null;
  const done = items.filter((item) => item.done).length;

  return (
    <Card className="mb-6 p-4 md:p-5" data-testid="setup-checklist">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-bold">Finish setting up your shop</h2>
        <p className="text-[13px] text-muted">
          {done} of {items.length} done
        </p>
      </div>
      <ul className="mt-3 grid gap-1 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2">
            {item.auto || item.done ? (
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  item.done ? 'bg-ok-bar text-white' : 'text-muted',
                )}
              >
                {item.done ? <Check className="size-4" /> : <Circle className="size-4" />}
              </span>
            ) : (
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-flow"
                aria-label={`Mark done: ${item.label}`}
                checked={item.done}
                onChange={(event) => tick.mutate({ key: item.key, done: event.target.checked })}
              />
            )}
            <Link
              to={item.link}
              className={cn(
                'flex min-h-11 flex-1 items-center text-sm font-semibold hover:underline',
                item.done ? 'text-muted line-through' : 'text-flow-text',
              )}
            >
              {item.label}
            </Link>
            {!item.auto && !item.done && <span className="text-xs text-muted">tick when done</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
