import { LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';
import { Logo } from '@/components/ui/Logo';
import { useLogout } from '@/features/auth/api';
import { roleLabel, useCurrentUser } from '@/features/auth/store';
import { useInventoryItems } from '@/features/inventory/api';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { cn } from '@/lib/cn';
import { can } from '@/lib/permissions';
import { NAV_ITEMS } from './nav';

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const logout = useLogout();
  const stock = useInventoryItems();
  const lowStock = (stock.data ?? []).filter((item) => item.stock_status !== 'ok').length;

  return (
    <div className="on-dark flex h-full flex-col bg-ink text-on-ink">
      <div className="flex items-center gap-2.5 px-4 pt-6 pb-5">
        <Logo className="size-9" />
        <div className="min-w-0">
          <p className="text-[17px] leading-tight font-extrabold tracking-[-0.02em]">LaundryFlow</p>
          <p className="text-[11px] leading-tight text-on-ink-muted">Bongabong, Oriental Mindoro</p>
        </div>
      </div>

      <nav aria-label="Main" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITEMS.filter((item) => can(user, item.ability)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-ink-2 font-bold text-on-ink'
                  : 'text-on-ink-muted hover:bg-ink-3 hover:text-on-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn('size-4.5 shrink-0', isActive && 'text-aqua')}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.stockBadge && lowStock > 0 && (
                  <span className="rounded-full bg-warn-bar px-1.5 text-xs font-bold text-ink">
                    {lowStock}
                    <span className="sr-only"> items low on stock</span>
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 p-3">
        <NotificationBell variant="sidebar" />
        <Dropdown>
          <DropdownTrigger className="flex min-h-14 w-full items-center gap-2.5 rounded-card bg-ink-3 p-2.5 text-left">
            <Avatar name={user.name} className="bg-aqua text-ink" solid={false} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{user.name}</span>
              <span className="block truncate text-xs text-on-ink-muted">
                {roleLabel(user.role)}
              </span>
            </span>
          </DropdownTrigger>
          <DropdownContent side="top" align="start" className="w-56">
            <DropdownItem
              icon={<LogOut className="size-4" aria-hidden="true" />}
              onSelect={() =>
                logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })
              }
            >
              Sign out
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </div>
  );
}
