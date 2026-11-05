import { Loader2, ShoppingBasket } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { useAuthStore } from '@/features/auth/store';
import { PublicHeader } from '@/layouts/PublicHeader';
import { can } from '@/lib/permissions';

/**
 * What a phone camera opens from a basket label. A basket is shared by many customers over time,
 * so without a staff session this page makes no request and says nothing about the basket: not
 * even whether it is in use.
 */
export default function BasketLinkPage() {
  const token = useParams().token ?? '';
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  useDocumentTitle('LaundryFlow basket');

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

  if (status === 'authenticated' && can(user, 'baskets.scan')) {
    return <Navigate to={`/scan?code=${encodeURIComponent(token)}`} replace />;
  }

  const next = encodeURIComponent(`/b/${token}`);
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-6">
        <Card className="p-6 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-flow-soft text-flow">
            <ShoppingBasket className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-extrabold tracking-[-0.01em]">
            This is a LaundryFlow laundry basket.
          </h1>
          <p className="mt-1 text-muted">Staff, please sign in.</p>
          <ButtonLink to={`/login?next=${next}`} variant="primary" className="mt-5 w-full">
            Staff sign in
          </ButtonLink>
        </Card>
      </main>
    </>
  );
}
