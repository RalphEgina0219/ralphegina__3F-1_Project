import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';
import { can, type Ability } from '@/lib/permissions';

/** Guards a route by ability: a user who may not see it lands on /403. */
export function RequireRole({ ability }: { ability: Ability }) {
  const user = useAuthStore((state) => state.user);
  return can(user, ability) ? <Outlet /> : <Navigate to="/403" replace />;
}
