import { AlertTriangle, Boxes, Clock, Hexagon, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StockChip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '@/components/ui/States';
import { Table, type Column } from '@/components/ui/Table';
import { useCan } from '@/features/auth/store';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/dates';
import { STOCK_META } from '@/lib/inventory';
import type { InventoryItemDto, InventoryMovementDto } from '@/types/api';
import { useInventoryItems, useInventoryMovements } from '../api';
import { InventoryItemDialog } from '../components/InventoryItemDialog';
import { StockMovementForm } from '../components/StockMovementForm';

function Alert({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'danger' | 'warn' | 'plain';
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-start gap-3 rounded-card border p-4',
        tone === 'danger' && 'border-danger-bg bg-danger-bg text-danger',
        tone === 'warn' && 'border-warn-line bg-warn-bg text-warn',
        tone === 'plain' && 'border-line bg-surface',
      )}
    >
      <span className={cn('shrink-0', tone === 'plain' && 'text-flow')}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[15px] font-bold">{title}</p>
        {children && (
          <p className={cn('text-[13px]', tone === 'plain' && 'text-muted')}>{children}</p>
        )}
      </div>
    </div>
  );
}

function namesList(items: readonly InventoryItemDto[]) {
  return items.map((item) => item.name).join(', ');
}

function Movement({ movement }: { movement: InventoryMovementDto }) {
  const positive = movement.signed_quantity > 0;
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="font-semibold">{movement.item_name}</p>
        <p className="text-[13px] text-muted">
          {formatDate(movement.moved_at)} · {movement.user.name}
          {movement.type === 'adjust' && ' · Adjustment'}
        </p>
        {movement.remarks && <p className="text-[13px] text-muted">{movement.remarks}</p>}
      </div>
      <p className={cn('shrink-0 font-bold', positive ? 'text-ok' : 'text-danger')}>
        {positive ? '+' : '−'}
        {Math.abs(movement.signed_quantity)} {movement.unit_code}
      </p>
    </li>
  );
}

export default function InventoryPage() {
  const canManage = useCan('inventory.manage');
  const canStockOut = useCan('inventory.stock_out');
  const [params] = useSearchParams();
  const items = useInventoryItems();
  const movements = useInventoryMovements();
  const [dialog, setDialog] = useState<{ open: boolean; item?: InventoryItemDto }>({ open: false });

  const rows = items.data ?? [];
  const critical = rows.filter((item) => item.stock_status === 'critical');
  const low = rows.filter((item) => item.stock_status === 'low');
  const lastStockIn = movements.data?.data.find((m) => m.type === 'in');

  const columns: Column<InventoryItemDto>[] = [
    {
      key: 'item',
      header: 'Item',
      card: 'title',
      cell: (item) => <span className="font-semibold">{item.name}</span>,
    },
    { key: 'unit', header: 'Unit', cell: (item) => item.unit_code },
    {
      key: 'onhand',
      header: 'On hand',
      cell: (item) => (
        <span className={cn('font-bold', STOCK_META[item.stock_status].text)}>{item.on_hand}</span>
      ),
    },
    { key: 'reorder', header: 'Reorder at', cell: (item) => item.reorder_level },
    {
      key: 'level',
      header: 'Level',
      card: 'subtitle',
      className: 'w-36',
      cell: (item) => (
        <ProgressBar
          label={`${item.name} stock level`}
          percent={item.level_percent}
          barClass={STOCK_META[item.stock_status].bar}
          className="max-md:mt-1.5"
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      card: 'badge',
      cell: (item) => <StockChip status={item.stock_status} />,
    },
    ...(canManage
      ? [
          {
            key: 'edit',
            header: <span className="sr-only">Edit</span>,
            card: 'actions' as const,
            cell: (item: InventoryItemDto) => (
              <Button
                variant="secondary"
                aria-label={`Edit ${item.name}`}
                onClick={() => setDialog({ open: true, item })}
              >
                Edit
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Laundry supplies. Alerts are based on recorded stock, not automatic usage."
        actions={
          canManage && (
            <Button
              icon={<Plus className="size-4" aria-hidden="true" />}
              onClick={() => setDialog({ open: true })}
            >
              Add supply item
            </Button>
          )
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-3 md:gap-4">
        {items.isPending ? (
          <>
            <Skeleton className="h-20 rounded-card" />
            <Skeleton className="h-20 rounded-card" />
            <Skeleton className="h-20 rounded-card" />
          </>
        ) : (
          <>
            {critical.length > 0 ? (
              <Alert
                tone="danger"
                icon={<AlertTriangle className="size-6" aria-hidden="true" />}
                title={`${critical.length} ${critical.length === 1 ? 'item' : 'items'} critically low`}
              >
                {namesList(critical)}
              </Alert>
            ) : (
              <Alert
                tone="plain"
                icon={<Hexagon className="size-6" aria-hidden="true" />}
                title="Nothing critical"
              />
            )}
            {low.length > 0 ? (
              <Alert
                tone="warn"
                icon={<Clock className="size-6" aria-hidden="true" />}
                title={`${low.length} ${low.length === 1 ? 'item' : 'items'} below reorder level`}
              >
                {namesList(low)}
              </Alert>
            ) : (
              <Alert
                tone="plain"
                icon={<Clock className="size-6" aria-hidden="true" />}
                title="Nothing below reorder level"
              />
            )}
            <Alert
              tone="plain"
              icon={<Hexagon className="size-6" aria-hidden="true" />}
              title={`${rows.length} items tracked`}
            >
              {lastStockIn
                ? `Last stock-in ${formatDate(lastStockIn.moved_at)} by ${lastStockIn.user.name}`
                : 'No recent stock-in'}
            </Alert>
          </>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <Card className="min-w-0 overflow-hidden">
          {items.isPending && <SkeletonRows rows={8} />}
          {items.isError && <ErrorState error={items.error} onRetry={() => void items.refetch()} />}
          {items.data?.length === 0 && (
            <EmptyState
              icon={Boxes}
              title="No supplies yet"
              description="Add the supplies you want to keep track of."
              action={
                canManage && (
                  <Button variant="secondary" onClick={() => setDialog({ open: true })}>
                    Add supply item
                  </Button>
                )
              }
            />
          )}
          {rows.length > 0 && (
            <Table
              columns={columns}
              rows={rows}
              rowKey={(item) => item.id}
              caption="Supply items"
              rowClass={(item) =>
                item.stock_status === 'critical' ? 'bg-danger-bg/30' : undefined
              }
              minWidth="600px"
              dense
            />
          )}
        </Card>

        <div className="min-w-0 space-y-5">
          {canStockOut && rows.length > 0 && (
            <StockMovementForm
              items={rows}
              presetItemId={Number(params.get('item')) || undefined}
            />
          )}
          <Card className="p-5">
            <CardHeader title="Recent movements" className="mb-1" />
            {movements.isPending && <SkeletonRows rows={3} className="p-0 pt-2" />}
            {movements.isError && (
              <ErrorState error={movements.error} onRetry={() => void movements.refetch()} />
            )}
            {movements.data?.data.length === 0 && (
              <EmptyState title="No movements yet" className="py-5" />
            )}
            <ul className="divide-y divide-line">
              {movements.data?.data.map((movement) => (
                <Movement key={movement.id} movement={movement} />
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <InventoryItemDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        item={dialog.item}
      />
    </>
  );
}
