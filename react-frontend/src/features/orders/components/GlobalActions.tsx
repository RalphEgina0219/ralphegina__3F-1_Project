import { Plus, ScanLine } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

export function ScanAndNewButtons({ hideScanOnPhone = true }: { hideScanOnPhone?: boolean }) {
  return (
    <>
      <ButtonLink
        to="/scan"
        className={hideScanOnPhone ? 'max-md:hidden' : undefined}
        icon={<ScanLine className="size-4" aria-hidden="true" />}
      >
        Scan QR
      </ButtonLink>
      <ButtonLink
        to="/orders/new"
        variant="primary"
        className="max-md:hidden"
        icon={<Plus className="size-4" aria-hidden="true" />}
      >
        New order
      </ButtonLink>
    </>
  );
}
