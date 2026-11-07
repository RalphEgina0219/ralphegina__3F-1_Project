import { AlertTriangle, Compass, ShieldAlert } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { isChunkLoadError, OfflinePage } from '@/features/pwa/components/OfflinePage';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="flex min-h-[70dvh] items-center justify-center p-4">
      <main>
        <EmptyState
          icon={Compass}
          title="404: This page does not exist"
          description="The link may be old or mistyped."
          action={
            <ButtonLink to="/" variant="primary">
              Go to dashboard
            </ButtonLink>
          }
        />
        <h1 className="sr-only">Page not found</h1>
      </main>
    </div>
  );
}

export function ForbiddenPage() {
  useDocumentTitle('Not allowed');
  return (
    <div className="flex min-h-[70dvh] items-center justify-center p-4">
      <div>
        <h1 className="sr-only">Not allowed</h1>
        <EmptyState
          icon={ShieldAlert}
          title="403: You do not have access to this page"
          description="Ask the shop owner if you need this for your work."
          action={
            <ButtonLink to="/" variant="primary">
              Go to dashboard
            </ButtonLink>
          }
        />
      </div>
    </div>
  );
}

/** Router-level safety net, for example when a lazy chunk fails after a redeploy. */
export function RouteErrorPage() {
  const error = useRouteError();
  useDocumentTitle('Something went wrong');
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  // A page's code could not be downloaded: no connection, or a newer deploy replaced it.
  if (isChunkLoadError(error) || !navigator.onLine) return <OfflinePage />;
  return (
    <div className="flex min-h-[70dvh] items-center justify-center p-4">
      <div>
        <h1 className="sr-only">Something went wrong</h1>
        <EmptyState
          icon={AlertTriangle}
          title="Something went wrong"
          description="Reload the page to try again. Your saved work is safe."
          action={<Button onClick={() => window.location.reload()}>Reload</Button>}
        />
      </div>
    </div>
  );
}
