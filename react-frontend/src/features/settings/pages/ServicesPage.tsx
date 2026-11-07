import { Plus, Tags } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Money } from '@/components/ui/Money';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Switch } from '@/components/ui/Switch';
import { Table, type Column } from '@/components/ui/Table';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatKg } from '@/lib/format';
import type { Service } from '@/types/api';
import { useSaveService, useServices } from '../api';
import { PRICING_LABELS, ServiceFormDialog } from '../components/ServiceFormDialog';

export default function ServicesPage() {
  useDocumentTitle('Services & rates');
  const services = useServices();
  const save = useSaveService();
  const [dialog, setDialog] = useState<{ open: boolean; service?: Service }>({ open: false });

  const toggle = (service: Service, is_active: boolean) => {
    save.mutate(
      { id: service.id, is_active },
      {
        onSuccess: () =>
          toast.success(`${service.name} ${is_active ? 'activated' : 'deactivated'}`),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  const muted = (service: Service) => cn(!service.is_active && 'text-muted');

  const columns: Column<Service>[] = [
    {
      key: 'service',
      header: 'Service',
      card: 'title',
      cell: (s) => (
        <div className={muted(s)}>
          <p className="font-semibold">{s.name}</p>
          {s.description && <p className="text-[13px] font-normal text-muted">{s.description}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Pricing type',
      cell: (s) => <span className={muted(s)}>{PRICING_LABELS[s.pricing_type]}</span>,
    },
    {
      key: 'rate',
      header: 'Rate',
      align: 'right',
      cell: (s) => <Money cents={s.rate_cents} className={cn('font-bold', muted(s))} />,
    },
    {
      key: 'minimum',
      header: 'Minimum',
      cell: (s) => (
        <span className={muted(s)}>{s.minimum_qty ? formatKg(s.minimum_qty) : '—'}</span>
      ),
    },
    {
      key: 'active',
      header: 'Active',
      card: 'badge',
      cell: (s) => (
        <Switch
          checked={s.is_active}
          onCheckedChange={(next) => toggle(s, next)}
          aria-label={`${s.name} is active`}
          needsNetwork
        />
      ),
    },
    {
      key: 'edit',
      header: <span className="sr-only">Edit</span>,
      card: 'actions',
      cell: (s) => (
        <Button
          variant="secondary"
          aria-label={`Edit ${s.name}`}
          onClick={() => setDialog({ open: true, service: s })}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Services & rates"
        className="p-4 md:p-5"
        action={
          <Button
            icon={<Plus className="size-4" aria-hidden="true" />}
            onClick={() => setDialog({ open: true })}
          >
            Add service
          </Button>
        }
      />
      {services.isPending && <SkeletonRows rows={6} />}
      {services.isError && (
        <ErrorState error={services.error} onRetry={() => void services.refetch()} />
      )}
      {services.data?.length === 0 && (
        <EmptyState
          icon={Tags}
          title="No services yet"
          description="Add the services and rates your shop offers."
        />
      )}
      {services.data && services.data.length > 0 && (
        <Table
          columns={columns}
          rows={services.data}
          rowKey={(s) => s.id}
          caption="Services and rates"
          minWidth="720px"
        />
      )}
      <p className="border-t border-line px-4 py-3 text-[13px] text-muted md:px-5">
        The sample rates shown are placeholders; set the shop&apos;s real prices before launch.
      </p>
      <ServiceFormDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        service={dialog.service}
      />
    </Card>
  );
}
