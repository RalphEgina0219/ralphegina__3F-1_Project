import { format, parseISO } from 'date-fns';
import { History, KeyRound, Plus, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'sonner';
import { Badge, StatusChip } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Money } from '@/components/ui/Money';
import { OrderLink } from '@/components/ui/Mono';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '@/components/ui/States';
import {
  TemporaryPasswordDialog,
  type TemporaryPassword,
} from '@/components/ui/TemporaryPasswordDialog';
import { useCan } from '@/features/auth/store';
import { errorMessage, errorStatus } from '@/lib/api';
import { formatDate, formatRelativeDay } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { formatPhone } from '@/lib/format';
import {
  useCustomer,
  useCustomerOrders,
  useResetCustomerPassword,
  useSetCustomerAccountActive,
} from '../api';
import { CreateAccountDialog } from './CreateAccountDialog';
import { AccountNote, CustomerFormDialog } from './CustomerFormDialog';

function Stat({
  label,
  children,
  warn,
}: {
  label: string;
  children: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div
      className={
        warn ? 'rounded-control bg-warn-bg p-2.5 text-warn' : 'rounded-control bg-foam p-2.5'
      }
    >
      <dt className={warn ? 'text-xs' : 'text-xs text-muted'}>{label}</dt>
      <dd className="truncate text-[17px] font-extrabold tracking-[-0.02em]">{children}</dd>
    </div>
  );
}

export function CustomerProfile({ id }: { id: number }) {
  const customer = useCustomer(id);
  const orders = useCustomerOrders(id);
  const [editing, setEditing] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [temporary, setTemporary] = useState<TemporaryPassword | null>(null);
  const resetPassword = useResetCustomerPassword();
  const setActive = useSetCustomerAccountActive();
  const canDisable = useCan('settings.manage');

  if (customer.isPending) {
    return (
      <Card className="p-5" role="status" aria-label="Loading customer">
        <Skeleton className="h-14 w-48" />
        <Skeleton className="mt-4 h-20 w-full" />
        <Skeleton className="mt-4 h-40 w-full" />
      </Card>
    );
  }
  if (customer.isError) {
    return (
      <Card>
        {errorStatus(customer.error) === 404 ? (
          <EmptyState
            icon={Users}
            title="Customer not found"
            action={<ButtonLink to="/customers">Back to customers</ButtonLink>}
          />
        ) : (
          <ErrorState error={customer.error} onRetry={() => void customer.refetch()} />
        )}
      </Card>
    );
  }

  const c = customer.data;
  const address = [c.street_address, `Brgy. ${c.barangay_name}`, 'Bongabong']
    .filter(Boolean)
    .join(', ');

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar name={c.full_name} solid className="size-13 text-base" />
        <div className="min-w-0">
          <h2 className="truncate text-[19px] font-bold tracking-[-0.01em]">{c.full_name}</h2>
          <p className="text-[13px] text-muted">
            Customer since {format(parseISO(c.created_at), 'MMM yyyy')}
          </p>
        </div>
      </div>

      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex items-center gap-1.5">
          <dt className="text-muted">Contact:</dt>
          <dd>
            <a
              href={`tel:${c.contact_number}`}
              className="inline-flex min-h-11 items-center underline-offset-2 hover:underline"
            >
              {formatPhone(c.contact_number)}
            </a>
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="shrink-0 text-muted">Address:</dt>
          <dd>{address}</dd>
        </div>
        {c.notes && (
          <div className="flex gap-1.5">
            <dt className="shrink-0 text-muted">Notes:</dt>
            <dd>{c.notes}</dd>
          </div>
        )}
      </dl>

      <section
        aria-labelledby="account-heading"
        className="mt-4 rounded-control border border-line p-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="account-heading" className="text-[15px] font-bold">
            Account
          </h3>
          {c.account ? (
            <Badge tone={c.account.is_active ? 'ok' : 'danger'}>
              {c.account.is_active ? 'Active' : 'Disabled'}
            </Badge>
          ) : (
            <Badge tone="warn">No account</Badge>
          )}
        </div>
        {c.account ? (
          <>
            <p className="mt-1 text-sm break-all">{c.account.email}</p>
            <p className="text-[13px] text-muted">
              {c.account.must_change_password
                ? 'Waiting for the customer to set their own password'
                : c.account.last_login_at
                  ? `Last signed in ${formatRelativeDay(c.account.last_login_at)}`
                  : 'Has not signed in yet'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="compact"
                icon={<KeyRound className="size-4" aria-hidden="true" />}
                onClick={() => setResetting(true)}
              >
                Set temporary password
              </Button>
              {canDisable && (
                <Button
                  variant="ghost"
                  size="compact"
                  loading={setActive.isPending}
                  onClick={() =>
                    setActive.mutate(
                      { id: c.id, is_active: !c.account?.is_active },
                      {
                        onSuccess: (saved) =>
                          toast.success(
                            saved.account?.is_active ? 'Account enabled' : 'Account disabled',
                          ),
                        onError: (error) => toast.error(errorMessage(error)),
                      },
                    )
                  }
                >
                  {c.account.is_active ? 'Disable sign-in' : 'Enable sign-in'}
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-[13px] text-muted">
              On file from before accounts. Create one before taking a new order: the account is
              where the customer follows their laundry.
            </p>
            <Button
              className="mt-2"
              size="compact"
              icon={<UserPlus className="size-4" aria-hidden="true" />}
              onClick={() => setCreatingAccount(true)}
            >
              Create account
            </Button>
          </>
        )}
      </section>

      <dl className="mt-4 grid grid-cols-[auto_1fr_1fr] gap-2">
        <Stat label="Orders">{c.orders_count}</Stat>
        <Stat label="Spent">
          <Money cents={c.total_spent_cents} whole />
        </Stat>
        <Stat label="Due" warn={c.balance_cents > 0}>
          <Money cents={c.balance_cents} />
        </Stat>
      </dl>

      <h3 className="mt-5 mb-2 text-[15px] font-bold">Transaction history</h3>
      {orders.isPending && <SkeletonRows rows={3} className="p-0" />}
      {orders.isError && <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />}
      {orders.data?.length === 0 && (
        <EmptyState icon={History} title="No orders yet" className="py-5" />
      )}
      <ul className="max-h-72 divide-y divide-line overflow-y-auto">
        {orders.data?.map((order) => (
          <li key={order.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <OrderLink id={order.id} number={order.order_number} className="text-[13px]" />
              <p className="text-[13px] text-muted">
                {formatDate(order.received_at)} · {formatMoney(order.total_cents)}
                {order.baskets.length > 0 &&
                  ` · ${order.baskets.map((b) => b.basket_number).join(', ')}`}
              </p>
            </div>
            <StatusChip status={order.status} short />
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {c.has_account ? (
          <ButtonLink
            to={`/orders/new?customer_id=${c.id}`}
            variant="primary"
            icon={<Plus className="size-4" aria-hidden="true" />}
          >
            New order
          </ButtonLink>
        ) : (
          <Button
            icon={<UserPlus className="size-4" aria-hidden="true" />}
            onClick={() => setCreatingAccount(true)}
          >
            Create account
          </Button>
        )}
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
      <CustomerFormDialog open={editing} onOpenChange={setEditing} customer={c} />
      <CreateAccountDialog
        customer={creatingAccount ? c : null}
        onClose={() => setCreatingAccount(false)}
      />
      <ConfirmDialog
        open={resetting}
        onOpenChange={setResetting}
        title={`Set a temporary password for ${c.full_name}?`}
        description="Their current password stops working. They must choose a new one when they next sign in."
        confirmLabel="Set temporary password"
        loading={resetPassword.isPending}
        onConfirm={() =>
          resetPassword.mutate(c.id, {
            onSuccess: ({ customer: saved, temporary_password }) => {
              setResetting(false);
              setTemporary({
                name: saved.full_name,
                password: temporary_password,
                note: <AccountNote email={saved.account?.email} />,
              });
            },
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      />
      <TemporaryPasswordDialog value={temporary} onClose={() => setTemporary(null)} />
    </Card>
  );
}
