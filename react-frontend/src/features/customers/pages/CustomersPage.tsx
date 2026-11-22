import { Plus, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/ui/Money';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Table, type Column } from '@/components/ui/Table';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/dates';
import { formatPhone } from '@/lib/format';
import type { CustomerDto } from '@/types/api';
import { useCustomers } from '../api';
import { CustomerFormDialog } from '../components/CustomerFormDialog';
import { CustomerProfile } from '../components/CustomerProfile';

const COLUMNS: Column<CustomerDto>[] = [
  {
    key: 'name',
    header: 'Customer',
    card: 'title',
    cell: (c) => (
      <Link
        to={`/customers/${c.id}`}
        className="flex min-h-11 items-center gap-2.5 font-semibold hover:text-flow-text"
      >
        <Avatar name={c.full_name} />
        <span className="min-w-0 truncate">{c.full_name}</span>
      </Link>
    ),
  },
  {
    key: 'contact',
    header: 'Contact no.',
    card: 'subtitle',
    cell: (c) => <span className="whitespace-nowrap">{formatPhone(c.contact_number)}</span>,
  },
  {
    key: 'account',
    header: 'Account',
    cell: (c) =>
      c.account ? (
        <span className="block max-w-48 truncate text-[13px]" title={c.account.email}>
          {c.account.email}
        </span>
      ) : (
        <Badge tone="warn">No account</Badge>
      ),
  },
  { key: 'barangay', header: 'Barangay', cell: (c) => c.barangay_name },
  { key: 'orders', header: 'Orders', cell: (c) => c.orders_count },
  {
    key: 'visit',
    header: 'Last visit',
    cell: (c) => (c.last_visit_at ? formatDate(c.last_visit_at) : '—'),
  },
  {
    key: 'balance',
    header: 'Balance',
    align: 'right',
    card: 'badge',
    cell: (c) => <Money cents={c.balance_cents} warnIfDue />,
  },
];

export default function CustomersPage() {
  const { id } = useParams();
  const selectedId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [adding, setAdding] = useState(false);
  const debounced = useDebouncedValue(search);
  const page = Number(params.get('page')) || 1;

  const query = useCustomers({ search: debounced, page });
  const meta = query.data?.meta;

  const updateSearch = (value: string) => {
    setSearch(value);
    setParams(
      (current) => {
        current.delete('page');
        return current;
      },
      { replace: true },
    );
  };

  return (
    <>
      <PageHeader
        title="Customers"
        back={
          selectedId ? { to: '/customers', label: 'All customers', phoneOnly: true } : undefined
        }
        titleClassName={selectedId ? 'max-lg:sr-only' : undefined}
        subtitle={
          meta && !selectedId
            ? `${meta.total} customers · ${meta.with_balance} with unpaid balances`
            : undefined
        }
        actions={
          <div
            className={cn('flex w-full flex-wrap gap-2 sm:w-auto', selectedId && 'max-lg:hidden')}
          >
            <Input
              type="search"
              aria-label="Search customers by name, email or contact number"
              placeholder="Name, email or contact number"
              icon={<Search className="size-4" aria-hidden="true" />}
              wrapperClassName="min-w-0 flex-1 sm:w-64 sm:flex-none"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
            />
            <Button
              icon={<Plus className="size-4" aria-hidden="true" />}
              onClick={() => setAdding(true)}
            >
              New customer
            </Button>
          </div>
        }
        className={selectedId ? 'max-lg:mb-3' : undefined}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* On phones and tablets the list and the profile are separate screens. */}
        <Card className={cn('min-w-0 overflow-hidden', selectedId && 'max-lg:hidden')}>
          {query.isPending && <SkeletonRows rows={8} />}
          {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
          {query.data?.data.length === 0 && (
            <EmptyState
              icon={Users}
              title={debounced ? 'No customers match your search' : 'No customers yet'}
              description={
                debounced ? 'Check the spelling, or add them as a new customer.' : undefined
              }
              action={
                <Button variant="secondary" onClick={() => setAdding(true)}>
                  New customer
                </Button>
              }
            />
          )}
          {query.data && query.data.data.length > 0 && (
            <>
              <Table
                columns={COLUMNS}
                rows={query.data.data}
                rowKey={(c) => c.id}
                caption="Customers"
                isSelected={(c) => c.id === selectedId}
                minWidth="760px"
                dense
              />
              <Pagination
                className="border-t border-line"
                meta={query.data.meta}
                onPageChange={(next) =>
                  setParams((current) => {
                    current.set('page', String(next));
                    return current;
                  })
                }
              />
            </>
          )}
        </Card>

        <aside className={cn('min-w-0 lg:sticky lg:top-6', !selectedId && 'max-lg:hidden')}>
          {selectedId ? (
            <CustomerProfile key={selectedId} id={selectedId} />
          ) : (
            <Card>
              <EmptyState
                icon={Users}
                title="Select a customer"
                description="Their contact details, balance and order history appear here."
              />
            </Card>
          )}
        </aside>
      </div>

      <CustomerFormDialog
        open={adding}
        onOpenChange={setAdding}
        initialName={/\d/.test(search) ? '' : search}
        onSaved={(customer) => navigate(`/customers/${customer.id}`)}
      />
    </>
  );
}
