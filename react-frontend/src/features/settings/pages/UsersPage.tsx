import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Mono } from '@/components/ui/Mono';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Table, type Column } from '@/components/ui/Table';
import {
  TemporaryPasswordDialog,
  type TemporaryPassword,
} from '@/components/ui/TemporaryPasswordDialog';
import { useCurrentUser } from '@/features/auth/store';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { errorMessage } from '@/lib/api';
import { formatRelativeDay } from '@/lib/dates';
import type { UserDto } from '@/types/api';
import type { PermissionCode } from '@/types/entities';
import {
  useDisableUser,
  useResetPassword,
  useRolePermissions,
  useSaveUser,
  useUpdateStaffPermissions,
  useUsers,
} from '../api';
import { UserFormDialog } from '../components/UserFormDialog';

function StaffPermissions() {
  const query = useRolePermissions();
  const update = useUpdateStaffPermissions();
  const online = useOnlineStatus();
  // Set in the click handler itself so that the box ticks at once, and rolled back on failure.
  const [optimistic, setOptimistic] = useState<PermissionCode[] | null>(null);
  const staff = optimistic ?? query.data?.staff ?? [];

  const toggle = (code: PermissionCode, checked: boolean) => {
    const next = checked ? [...staff, code] : staff.filter((c) => c !== code);
    setOptimistic(next);
    update.mutate(next, {
      onSuccess: () => toast.success('Staff permissions updated'),
      onError: (error) => toast.error(errorMessage(error)),
      onSettled: () => setOptimistic(null),
    });
  };

  return (
    <Card className="p-4 md:p-5">
      <CardHeader
        title="Staff permissions"
        subtitle="These apply to every staff account from their next page load. The server enforces them right away."
        className="mb-2"
      />
      {query.isPending && <SkeletonRows rows={3} className="p-0" />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      {/* Each tick saves at once, so the list waits for a connection. */}
      <fieldset disabled={!online} className="flex flex-col">
        <legend className="sr-only">Staff permissions</legend>
        {!online && (
          <p className="mb-1 text-[13px] text-muted">
            You&apos;re offline. Permissions can&apos;t be changed until you reconnect.
          </p>
        )}
        {query.data?.available.map((permission) => (
          <Checkbox
            key={permission.code}
            label={permission.label}
            checked={staff.includes(permission.code)}
            onChange={(event) => toggle(permission.code, event.target.checked)}
          />
        ))}
      </fieldset>
    </Card>
  );
}

export default function UsersPage() {
  useDocumentTitle('Users & roles');
  const me = useCurrentUser();
  const users = useUsers();
  const save = useSaveUser();
  const disable = useDisableUser();
  const resetPassword = useResetPassword();
  const [dialog, setDialog] = useState<{ open: boolean; user?: UserDto }>({ open: false });
  const [disabling, setDisabling] = useState<UserDto | null>(null);
  const [resetting, setResetting] = useState<UserDto | null>(null);
  const [temporary, setTemporary] = useState<TemporaryPassword | null>(null);

  const columns: Column<UserDto>[] = [
    {
      key: 'name',
      header: 'Name',
      card: 'title',
      cell: (u) => <span className="font-semibold whitespace-nowrap">{u.name}</span>,
    },
    {
      key: 'username',
      header: 'Username',
      card: 'subtitle',
      cell: (u) => <Mono className="text-[13px]">{u.username}</Mono>,
    },
    {
      key: 'role',
      header: 'Role',
      cell: (u) => (
        <Badge tone={u.role === 'admin' ? 'ink' : 'flow'}>
          {u.role === 'admin' ? 'Administrator' : 'Laundry Staff'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      card: 'badge',
      cell: (u) => (
        <Badge tone={u.is_active ? 'ok' : 'neutral'}>{u.is_active ? 'Active' : 'Disabled'}</Badge>
      ),
    },
    {
      key: 'login',
      header: 'Last login',
      cell: (u) => (
        <span className="whitespace-nowrap">
          {u.last_login_at ? formatRelativeDay(u.last_login_at) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      card: 'actions',
      cell: (u) => (
        <div className="flex flex-wrap gap-2 md:justify-end max-md:*:flex-1">
          <Button
            variant="secondary"
            size="compact"
            aria-label={`Edit ${u.name}`}
            onClick={() => setDialog({ open: true, user: u })}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            size="compact"
            aria-label={`Reset password of ${u.name}`}
            onClick={() => setResetting(u)}
          >
            Reset password
          </Button>
          {u.is_active ? (
            <Button
              variant="secondary"
              size="compact"
              aria-label={`Disable ${u.name}`}
              disabled={u.id === me.id}
              title={u.id === me.id ? 'You cannot disable your own account' : undefined}
              onClick={() => setDisabling(u)}
            >
              Disable
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="compact"
              aria-label={`Enable ${u.name}`}
              loading={save.isPending && save.variables?.id === u.id}
              onClick={() =>
                save.mutate(
                  { id: u.id, is_active: true },
                  {
                    onSuccess: () => toast.success(`${u.name} can sign in again`),
                    onError: (error) => toast.error(errorMessage(error)),
                  },
                )
              }
            >
              Enable
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <CardHeader
          title="Users & roles"
          className="p-4 md:p-5"
          action={
            <Button
              icon={<Plus className="size-4" aria-hidden="true" />}
              onClick={() => setDialog({ open: true })}
            >
              Add staff
            </Button>
          }
        />
        {users.isPending && <SkeletonRows rows={4} />}
        {users.isError && <ErrorState error={users.error} onRetry={() => void users.refetch()} />}
        {users.data?.length === 0 && <EmptyState icon={Users} title="No accounts yet" />}
        {users.data && users.data.length > 0 && (
          <Table
            columns={columns}
            rows={users.data}
            rowKey={(u) => u.id}
            caption="User accounts"
            minWidth="880px"
            dense
          />
        )}
      </Card>

      <StaffPermissions />

      <UserFormDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        user={dialog.user}
      />
      <ConfirmDialog
        open={Boolean(disabling)}
        onOpenChange={(open) => {
          if (!open) setDisabling(null);
        }}
        title={`Disable ${disabling?.name}?`}
        description="They are signed out and can no longer sign in. Their past records stay. You can enable the account again later."
        confirmLabel="Disable account"
        variant="danger"
        loading={disable.isPending}
        onConfirm={() => {
          if (!disabling) return;
          disable.mutate(disabling.id, {
            onSuccess: () => {
              toast.success(`${disabling.name} disabled`);
              setDisabling(null);
            },
            onError: (error) => toast.error(errorMessage(error)),
          });
        }}
      />
      <ConfirmDialog
        open={Boolean(resetting)}
        onOpenChange={(open) => {
          if (!open) setResetting(null);
        }}
        title={`Reset the password of ${resetting?.name}?`}
        description="Their current password stops working. You will see a temporary one to pass on to them."
        confirmLabel="Reset password"
        loading={resetPassword.isPending}
        onConfirm={() => {
          if (!resetting) return;
          resetPassword.mutate(resetting.id, {
            onSuccess: (password) => {
              setTemporary({ name: resetting.name, password });
              setResetting(null);
            },
            onError: (error) => toast.error(errorMessage(error)),
          });
        }}
      />
      <TemporaryPasswordDialog value={temporary} onClose={() => setTemporary(null)} />
    </div>
  );
}
