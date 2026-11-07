import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';
import { lastSide } from '@/features/pwa/side';

export function RequireAuth() {
  const status = useAuthStore((state) => state.status);
  const signedOut = useAuthStore((state) => state.signedOut);
  const location = useLocation();

  if (status === 'loading') {
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
  if (status === 'guest') {
    // The installed app always opens at "/": a customer's phone goes back to their own account.
    if (location.pathname === '/' && lastSide() === 'customer')
      return <Navigate to="/my" replace />;
    const next = location.pathname + location.search;
    const keepPage = !signedOut && next !== '/';
    return (
      <Navigate to={keepPage ? `/login?next=${encodeURIComponent(next)}` : '/login'} replace />
    );
  }
  return <Outlet />;
}
