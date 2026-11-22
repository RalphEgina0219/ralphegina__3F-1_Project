import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { BrandLogo } from '@/features/branding/BrandLogo';
import { useBranding } from '@/features/branding/BrandingProvider';
import { ThemeToggle } from '@/features/theme/ThemeToggle';

/**
 * Shown at /offline and whenever part of the app (a page's code) can't be downloaded: no
 * connection, or a new version replaced the old files. Part of the main bundle, so it always loads.
 */
export function OfflinePage() {
  const branding = useBranding();
  useDocumentTitle("You're offline");
  const retry = () => {
    if (window.location.pathname === '/offline') window.location.assign('/');
    else window.location.reload();
  };
  return (
    <main className="pt-safe flex min-h-dvh items-center justify-center bg-foam px-4 py-10">
      <div className="pt-safe fixed top-2 right-2">
        <ThemeToggle className="border border-line bg-surface/90" />
      </div>
      <div className="max-w-sm text-center">
        <BrandLogo className="mx-auto size-16" />
        <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">
          This page needs a connection
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          {branding.system_name} couldn&apos;t load this screen. Check the Wi-Fi or mobile data,
          then try again. Nothing you saved is lost.
        </p>
        <Button
          size="lg"
          className="mt-6 w-full"
          icon={<RotateCw className="size-4" aria-hidden="true" />}
          onClick={retry}
        >
          Retry
        </Button>
      </div>
    </main>
  );
}

/** A lazy page's code failed to download. Browsers word this differently. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Failed to fetch/i.test(
    message,
  );
}
