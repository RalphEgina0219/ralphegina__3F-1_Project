import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { bootstrapCustomer, useCustomerAuth } from '@/features/portal/store';

const FORCED_PASSWORD_PATH = '/my/password';

/**
 * Guards the customer portal with the customer session only. A staff session does not count.
 * Until a temporary password is replaced, the change-password page is the only page.
 */
export function RequireCustomer() {
  const status = useCustomerAuth((state) => state.status);
  const customer = useCustomerAuth((state) => state.customer);
  const location = useLocation();

  useEffect(() => {
    void bootstrapCustomer();
  }, []);

  if (status === 'idle' || status === 'loading') {
    return (
      <div
        role="status"
        aria-label="Loading"
        className="flex min-h-dvh items-center justify-center"
      >
        <Loader2 className="size-8 animate-spin text-flow" aria-hidden="true" />
      </div>
    );
  }
  if (!customer) {
    const next = location.pathname + location.search;
    return (
      <Navigate
        to={next === '/my' ? '/my/login' : `/my/login?next=${encodeURIComponent(next)}`}
        replace
      />
    );
  }
  const onForcedPage = location.pathname === FORCED_PASSWORD_PATH;
  if (customer.must_change_password && !onForcedPage) {
    return <Navigate to={FORCED_PASSWORD_PATH} replace />;
  }
  // Nothing to change (any more): the dashboard. This also runs the moment the forced change
  // saves, before the page's own navigation, so it must lead where that one does.
  if (!customer.must_change_password && onForcedPage) return <Navigate to="/my" replace />;
  return <Outlet />;
}
