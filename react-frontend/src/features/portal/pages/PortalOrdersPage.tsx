import { History } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusChip } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Money } from '@/components/ui/Money';
import { Mono } from '@/components/ui/Mono';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Table, type Column } from '@/components/ui/Table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { formatDate, formatRelativeDay } from '@/lib/dates';
import { loadSummary, servicesSummary } from '@/lib/format';
import type { PortalOrderDto } from '@/types/api';
import { useMyOrders, type OrderScope } from '../api';
import { basketList, LastUpdated, washTypeText } from '../components/PortalParts';

const COLUMNS: Column<PortalOrderDto>[] = [
  {
    key: 'number',
    header: 'Transaction ID',
    card: 'title',
    cell: (o) => (
      <Link
        to={`/my/orders/${o.order_number}`}
        className="inline-flex min-h-11 items-center font-mono font-medium whitespace-nowrap text-flow underline underline-offset-2 hover:text-flow-hover"
      >
        {o.order_number}
      </Link>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    card: 'badge',
    cell: (o) => <StatusChip status={o.status} short />,
  },
  {
    key: 'basket',
    header: 'Basket',
    cell: (o) => <Mono className="text-[13px]">{basketList(o)}</Mono>,
  },
  { key: 'received', header: 'Received', cell: (o) => formatDate(o.received_at) },
  {
    key: 'service',
    header: 'Service',
    cell: (o) => (
      <>
        {servicesSummary(o.items)}
        <span className="block text-xs text-muted">{washTypeText(o)}</span>
      </>
    ),
  },
  { key: 'weight', header: 'Weight', cell: (o) => loadSummary(o.items) },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    cell: (o) => <Money cents={o.total_cents} />,
  },
  {
    key: 'completion',
    header: 'Est. completion',
    cell: (o) =>
      o.released_at ? (
        <span className="text-muted">Completed {formatDate(o.released_at)}</span>
      ) : (
        formatRelativeDay(o.promised_at)
      ),
  },
];

/** /my/orders: every transaction, current and previous. */
export default function PortalOrdersPage() {
  useDocumentTitle('My orders');
  const [params, setParams] = useSearchParams();
  const scope: OrderScope = params.get('status') === 'completed' ? 'completed' : 'active';
  const page = Number(params.get('page')) || 1;
  const query = useMyOrders({ status: scope, page });
  const meta = query.data?.meta;

  return (
    <div className="space-y-4">
      <header className="pt-3">
        <h1 className="text-2xl leading-tight font-extrabold tracking-[-0.02em] md:text-[28px]">
          My orders
        </h1>
        <p className="mt-0.5 text-sm text-muted">Every order you have left at the shop.</p>
      </header>

      <Card className="min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <Tabs
            value={scope}
            onValueChange={(value) =>
              setParams(value === 'completed' ? { status: 'completed' } : {}, { replace: true })
            }
          >
            <TabsList aria-label="Filter orders">
              <TabsTrigger value="active">Active{meta ? ` (${meta.active})` : ''}</TabsTrigger>
              <TabsTrigger value="completed">
                Completed{meta ? ` (${meta.completed})` : ''}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <LastUpdated
            updatedAt={query.dataUpdatedAt}
            fetching={query.isFetching}
            onRefresh={() => void query.refetch()}
          />
        </div>

        {query.isPending && <SkeletonRows />}
        {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
        {query.data?.data.length === 0 && (
          <EmptyState
            icon={History}
            title={scope === 'active' ? 'No laundry in progress' : 'No completed orders yet'}
          />
        )}
        {query.data && query.data.data.length > 0 && (
          <>
            <Table
              columns={COLUMNS}
              rows={query.data.data}
              rowKey={(o) => o.order_number}
              caption={scope === 'active' ? 'Active orders' : 'Completed orders'}
              minWidth="860px"
              className="border-t border-line"
            />
            <Pagination
              className="border-t border-line"
              meta={query.data.meta}
              onPageChange={(next) =>
                setParams(
                  (current) => {
                    current.set('page', String(next));
                    return current;
                  },
                  { replace: true },
                )
              }
            />
          </>
        )}
      </Card>
    </div>
  );
}
