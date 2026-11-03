import { Plus, QrCode } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, PaymentChip, StatusChip, StockChip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dialog } from '@/components/ui/Dialog';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Logo } from '@/components/ui/Logo';
import { Money } from '@/components/ui/Money';
import { Mono } from '@/components/ui/Mono';
import { Pagination } from '@/components/ui/Pagination';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '@/components/ui/States';
import { Stepper } from '@/components/ui/Stepper';
import { Switch } from '@/components/ui/Switch';
import { Table, type Column } from '@/components/ui/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { STATUS_ORDER } from '@/lib/status';

interface Row {
  id: number;
  order: string;
  name: string;
}

const ROWS: Row[] = [
  { id: 1, order: 'LF-261031-0019', name: 'Maria Santos' },
  { id: 2, order: 'LF-261031-0018', name: 'Ana Reyes' },
];

const COLUMNS: Column<Row>[] = [
  { key: 'order', header: 'Order no.', card: 'title', cell: (row) => <Mono>{row.order}</Mono> },
  { key: 'name', header: 'Customer', cell: (row) => row.name },
  { key: 'status', header: 'Status', card: 'badge', cell: () => <StatusChip status="washing" /> },
  {
    key: 'open',
    header: <span className="sr-only">Open</span>,
    card: 'actions',
    cell: () => <Button variant="secondary">Open</Button>,
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <CardHeader title={title} className="mb-4" />
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </Card>
  );
}

/** Hidden preview of every UI kit component. Not linked from anywhere, development builds only. */
export default function DevUiPage() {
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [on, setOn] = useState(true);
  const [kilos, setKilos] = useState(6.5);
  const [select, setSelect] = useState('cash');

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">UI kit</h1>
      <Section title="Brand">
        <Logo />
        <div className="w-full rounded-card bg-ink pt-8">
          <WaveDivider fill="fill-foam" />
        </div>
      </Section>
      <Section title="Buttons">
        <Button icon={<Plus className="size-4" aria-hidden="true" />}>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="dashed">Dashed</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button size="icon" variant="secondary" aria-label="QR">
          <QrCode className="size-4" aria-hidden="true" />
        </Button>
      </Section>
      <Section title="Chips">
        {STATUS_ORDER.map((status) => (
          <StatusChip key={status} status={status} dot />
        ))}
        <PaymentChip status="paid" />
        <PaymentChip status="partial" />
        <PaymentChip status="unpaid" />
        <StockChip status="ok" />
        <StockChip status="low" />
        <StockChip status="critical" />
        <Badge tone="ink">Administrator</Badge>
        <Badge tone="flow">Laundry Staff</Badge>
      </Section>
      <Section title="Form controls">
        <Field label="Input" hint="With a hint" className="w-64">
          {(control) => <Input {...control} placeholder="Type here" />}
        </Field>
        <Field label="Invalid input" error="This field is required." className="w-64">
          {(control) => <Input {...control} />}
        </Field>
        <Field label="Select" className="w-64">
          {(control) => (
            <Select
              {...control}
              value={select}
              onValueChange={setSelect}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'gcash', label: 'GCash' },
              ]}
            />
          )}
        </Field>
        <Field label="Textarea" className="w-full">
          {(control) => <Textarea {...control} />}
        </Field>
        <Checkbox label="Checkbox" description="With a description" defaultChecked />
        <Switch checked={on} onCheckedChange={setOn} aria-label="Switch" />
        <QuantityStepper
          label="Weight"
          value={kilos}
          onChange={setKilos}
          step={0.1}
          decimals={1}
          unit="kg"
        />
      </Section>
      <Section title="Data display">
        <KpiCard label="Orders today" value="18" hint="+4 vs. last Saturday" className="w-52" />
        <KpiCard
          label="Unpaid"
          value={<Money cents={214000} whole />}
          hint="Across 9 orders"
          tone="warn"
          className="w-52"
        />
        <Avatar name="Maria Santos" />
        <Avatar name="Maria Santos" solid />
        <Money cents={36750} />
        <ProgressBar label="Level" percent={40} barClass="bg-warn-bar" className="w-40" />
      </Section>
      <Card className="p-5">
        <CardHeader title="Stepper" className="mb-4" />
        <Stepper
          label="Order progress"
          steps={[
            { key: 'a', label: 'Received', detail: '9:20 AM', state: 'done' },
            { key: 'b', label: 'Washing', detail: 'since 9:45 AM', state: 'current' },
            { key: 'c', label: 'Drying', state: 'upcoming' },
          ]}
        />
      </Card>
      <Card>
        <CardHeader title="Table / CardList" className="p-5 pb-2" />
        <Table columns={COLUMNS} rows={ROWS} rowKey={(row) => row.id} caption="Sample orders" />
        <Pagination
          meta={{ current_page: 2, per_page: 8, total: 48, last_page: 6 }}
          onPageChange={() => {}}
        />
      </Card>
      <Section title="Tabs, dropdown, dialogs">
        <Tabs defaultValue="one" className="w-full">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one" className="pt-3">
            First tab
          </TabsContent>
          <TabsContent value="two" className="pt-3">
            Second tab
          </TabsContent>
        </Tabs>
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="secondary">Dropdown</Button>
          </DropdownTrigger>
          <DropdownContent align="start">
            <DropdownItem>First item</DropdownItem>
            <DropdownItem>Second item</DropdownItem>
          </DropdownContent>
        </Dropdown>
        <Button variant="secondary" onClick={() => setDialog(true)}>
          Dialog / sheet
        </Button>
        <Button variant="secondary" onClick={() => setConfirm(true)}>
          Confirm with reason
        </Button>
        <Dialog
          open={dialog}
          onOpenChange={setDialog}
          title="Dialog"
          description="A bottom sheet below md."
          footer={<Button onClick={() => setDialog(false)}>Done</Button>}
        >
          Content
        </Dialog>
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="Void this payment?"
          reasonLabel="Reason"
          confirmLabel="Void payment"
          variant="danger"
          onConfirm={() => setConfirm(false)}
        />
      </Section>
      <Section title="States">
        <EmptyState
          icon={QrCode}
          title="Nothing here"
          description="An empty state."
          className="w-full"
        />
        <ErrorState error={new Error('x')} onRetry={() => {}} className="w-full" />
        <Skeleton className="h-8 w-40" />
        <SkeletonRows rows={2} className="w-full" />
      </Section>
    </main>
  );
}
