import { History, Search } from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Mono } from '@/components/ui/Mono';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatDateTime } from '@/lib/dates';
import { useActivityLogs, useUsers } from '../api';

const ENTITY_OPTIONS = [
  { value: 'all', label: 'All records' },
  { value: 'order', label: 'Orders' },
  { value: 'payment', label: 'Payments' },
  { value: 'customer', label: 'Customers' },
  { value: 'service', label: 'Services' },
  { value: 'inventory_item', label: 'Inventory' },
  { value: 'user', label: 'Users' },
  { value: 'role', label: 'Permissions' },
  { value: 'shop_settings', label: 'Shop profile' },
];

export default function ActivityPage() {
  useDocumentTitle('Activity log');
  const users = useUsers();
  const [userId, setUserId] = useState('all');
  const [entity, setEntity] = useState('all');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(action);

  const query = useActivityLogs({
    user_id: userId === 'all' ? '' : userId,
    entity: entity === 'all' ? '' : entity,
    action: debounced,
    from,
    to,
    page,
  });

  const changeFilter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Activity log" className="p-4 md:p-5 md:pb-3" />
      <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 md:px-5 xl:grid-cols-5">
        <Field label="User">
          {(field) => (
            <Select
              {...field}
              value={userId}
              onValueChange={(value) => changeFilter(() => setUserId(value))}
              options={[
                { value: 'all', label: 'Everyone' },
                ...(users.data ?? []).map((u) => ({ value: String(u.id), label: u.name })),
              ]}
            />
          )}
        </Field>
        <Field label="Record">
          {(field) => (
            <Select
              {...field}
              value={entity}
              onValueChange={(value) => changeFilter(() => setEntity(value))}
              options={ENTITY_OPTIONS}
            />
          )}
        </Field>
        <Field label="Action">
          {(field) => (
            <Input
              {...field}
              type="search"
              placeholder="For example voided"
              icon={<Search className="size-4" aria-hidden="true" />}
              value={action}
              onChange={(event) => changeFilter(() => setAction(event.target.value))}
            />
          )}
        </Field>
        <Field label="From">
          {(field) => (
            <Input
              {...field}
              type="date"
              value={from}
              onChange={(event) => changeFilter(() => setFrom(event.target.value))}
            />
          )}
        </Field>
        <Field label="To">
          {(field) => (
            <Input
              {...field}
              type="date"
              value={to}
              onChange={(event) => changeFilter(() => setTo(event.target.value))}
            />
          )}
        </Field>
      </div>

      {query.isPending && <SkeletonRows rows={8} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      {query.data?.data.length === 0 && (
        <EmptyState icon={History} title="No activity matches these filters" />
      )}
      {query.data && query.data.data.length > 0 && (
        <>
          <ul className="divide-y divide-line border-t border-line">
            {query.data.data.map((log) => (
              <li
                key={log.id}
                className="flex flex-col gap-x-4 gap-y-0.5 px-4 py-2.5 sm:flex-row md:px-5"
              >
                <Mono className="shrink-0 text-xs text-muted sm:w-32 sm:pt-0.5">
                  {formatDateTime(log.created_at)}
                </Mono>
                <p className="min-w-0 text-sm wrap-break-word">
                  <strong>{log.user?.name ?? 'System'}</strong> {log.summary}
                </p>
              </li>
            ))}
          </ul>
          <Pagination
            className="border-t border-line"
            meta={query.data.meta}
            onPageChange={setPage}
          />
        </>
      )}
    </Card>
  );
}
