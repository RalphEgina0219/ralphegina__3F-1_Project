import { FileDown, Printer, ReceiptText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Money } from '@/components/ui/Money';
import { Mono } from '@/components/ui/Mono';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { errorStatus } from '@/lib/api';
import { formatDateLong, formatDateTime, formatTime } from '@/lib/dates';
import { itemQuantityLabel } from '@/lib/format';
import { formatMoney, formatRate } from '@/lib/money';
import { printAs } from '@/lib/print';
import { trackingUrl } from '@/lib/tracking';
import { useReceipt } from '../api';

const divider = 'my-3 border-t border-dashed border-line-strong print:border-text';

export default function ReceiptPage() {
  const id = Number(useParams().id);
  const location = useLocation();
  const query = useReceipt(id);
  const receipt = query.data;
  useDocumentTitle(receipt ? `Receipt ${receipt.order_number}` : 'Receipt');

  // Arriving from "Save payment & print receipt" opens the print dialog once the receipt is ready.
  const autoPrinted = useRef(false);
  const autoPrint = (location.state as { autoPrint?: boolean } | null)?.autoPrint;
  useEffect(() => {
    if (receipt && autoPrint && !autoPrinted.current) {
      autoPrinted.current = true;
      printAs('receipt-58');
    }
  }, [receipt, autoPrint]);

  if (query.isPending) {
    return (
      <div role="status" aria-label="Loading receipt" className="mx-auto max-w-sm space-y-3 pt-4">
        <Skeleton className="h-140 rounded-card" />
      </div>
    );
  }
  if (query.isError) {
    return errorStatus(query.error) === 404 ? (
      <EmptyState
        icon={ReceiptText}
        title="Receipt not found"
        action={<ButtonLink to="/orders">Back to orders</ButtonLink>}
      />
    ) : (
      <ErrorState error={query.error} onRetry={() => void query.refetch()} />
    );
  }

  const r = query.data;
  return (
    <div className="mx-auto w-full max-w-sm max-md:pt-4">
      <h1 className="sr-only">Receipt for {r.order_number}</h1>
      <div className="mb-3 print:hidden">
        <ButtonLink to={`/orders/${r.order_id}`} variant="ghost" className="-ml-3">
          ← Back to order
        </ButtonLink>
      </div>

      <article className="receipt-sheet rounded-card border border-line bg-surface p-5 text-sm text-text print:text-text">
        <header className="text-center">
          <Logo className="mx-auto size-11 print:hidden" />
          <p className="receipt-large mt-2 text-xl font-extrabold tracking-[-0.02em]">
            {r.shop.name}
          </p>
          <p className="text-[13px] text-muted print:text-text">{r.shop.address}</p>
          <p className="text-[13px] text-muted print:text-text">{r.shop.contact_number}</p>
        </header>
        <div className={divider} />
        <dl className="space-y-1">
          <div className="flex justify-between gap-3">
            <dt>Order no.</dt>
            <dd>
              <Mono className="font-semibold">{r.order_number}</Mono>
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Receipt no.</dt>
            <dd>
              <Mono className="font-semibold">{r.receipt_number ?? 'Not yet paid'}</Mono>
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Date</dt>
            <dd className="text-right">
              {formatDateLong(r.issued_at)} · {formatTime(r.issued_at)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Customer</dt>
            <dd className="text-right">{r.customer_name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Staff</dt>
            <dd className="text-right">{r.staff_name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Pickup</dt>
            <dd className="text-right font-bold">{formatDateTime(r.promised_at)}</dd>
          </div>
        </dl>
        <div className={divider} />
        <ul className="space-y-2">
          {r.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <div className="min-w-0">
                <p>{item.service_name}</p>
                {item.pricing_type !== 'flat' && (
                  <p className="text-[13px] text-muted print:text-text">
                    {itemQuantityLabel(item)} × {formatRate(item.unit_price_cents)}
                  </p>
                )}
              </div>
              <Money cents={item.subtotal_cents} />
            </li>
          ))}
        </ul>
        <div className={divider} />
        <dl className="space-y-1">
          <div className="flex items-center justify-between text-[17px] font-extrabold">
            <dt className="receipt-large">TOTAL</dt>
            <dd>
              <Money cents={r.total_cents} className="receipt-large" />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Paid{r.paid_methods.length ? ` (${r.paid_methods.join(' + ')})` : ''}</dt>
            <dd>
              <Money cents={r.paid_cents} />
            </dd>
          </div>
          <div
            className={
              r.balance_cents > 0
                ? 'flex justify-between font-bold text-warn print:text-text'
                : 'flex justify-between font-bold'
            }
          >
            <dt>BALANCE DUE</dt>
            <dd>{formatMoney(r.balance_cents)}</dd>
          </div>
        </dl>
        <div className={divider} />
        <div className="avoid-break flex items-center gap-3">
          <QRCodeSVG
            value={trackingUrl(r.qr_token)}
            size={88}
            level="M"
            className="receipt-qr shrink-0"
            fgColor="var(--color-ink)"
            title="QR code to track this order"
          />
          <p className="min-w-0 text-[13px]">
            <strong>Scan to track your laundry.</strong> Shows status and pickup readiness only.
            Keep this receipt and present it when claiming.
          </p>
        </div>
        <div className={divider} />
        <p className="text-center text-[13px] text-muted print:text-text">
          {r.shop.receipt_footer}
        </p>
      </article>

      <div className="mt-3 grid grid-cols-2 gap-2 print:hidden">
        <Button
          size="lg"
          icon={<Printer className="size-4" aria-hidden="true" />}
          onClick={() => printAs('receipt-58')}
        >
          Print (58 mm)
        </Button>
        <Button
          variant="secondary"
          size="lg"
          icon={<Printer className="size-4" aria-hidden="true" />}
          onClick={() => printAs('receipt-a4')}
        >
          Print (A4)
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="col-span-2"
          icon={<FileDown className="size-4" aria-hidden="true" />}
          onClick={() => printAs('receipt-a4')}
        >
          Save as PDF
        </Button>
        <p className="col-span-2 text-center text-[13px] text-muted">
          To save a PDF, choose &ldquo;Save as PDF&rdquo; as the printer in the dialog.
        </p>
      </div>
    </div>
  );
}
