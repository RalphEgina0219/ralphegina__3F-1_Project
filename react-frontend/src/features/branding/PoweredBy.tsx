import { cn } from '@/lib/cn';
import { useBranding } from './BrandingProvider';

/** "Powered by LaundryFlow": only when the owner turns it on (off by default). */
export function PoweredBy({ className }: { className?: string }) {
  const branding = useBranding();
  if (!branding.show_powered_by) return null;
  return (
    <p
      className={cn('text-center text-[11px] opacity-70 print:hidden', className)}
      data-testid="powered-by"
    >
      Powered by LaundryFlow
    </p>
  );
}
