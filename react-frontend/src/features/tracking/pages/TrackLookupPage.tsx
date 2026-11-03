import { Link } from 'react-router-dom';
import { linkClass } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { PublicHeader } from '../components/PublicHeader';
import { TrackingLookupForm } from '../components/TrackingLookupForm';

export default function TrackLookupPage() {
  useDocumentTitle('Track my laundry');
  return (
    <>
      <PublicHeader>
        <h1 className="mt-5 text-[28px] leading-tight font-extrabold tracking-[-0.02em] text-on-ink">
          Track my laundry
        </h1>
        <p className="mt-1 text-sm text-on-ink-muted">
          Scan the QR on your receipt, or enter your order details below. No account needed.
        </p>
      </PublicHeader>
      <main className="mx-auto max-w-xl px-4 py-5">
        <Card className="p-5">
          <TrackingLookupForm />
        </Card>
        <p className="mt-4 text-center text-[13px] text-muted">
          This page shows status only. Personal and payment details stay private.
        </p>
        <p className="mt-2 text-center text-[13px]">
          <Link to="/login" className={linkClass}>
            Staff sign in
          </Link>
        </p>
      </main>
    </>
  );
}
