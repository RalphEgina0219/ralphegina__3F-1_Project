import { StatusChip } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Money } from '@/components/ui/Money';
import { Mono } from '@/components/ui/Mono';
import { cn } from '@/lib/cn';
import { formatDateTime, formatRelativeDay } from '@/lib/dates';
import { formatKg, formatPhone, itemQuantityLabel, itemRateSuffix } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { washBillLine } from '@/lib/wash';
import type { OrderSummaryData } from '@/types/api';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="min-w-0 font-semibold wrap-break-word">{children}</dd>
    </div>
  );
}

/**
 * The digital Order Summary that replaces the printed receipt. One read-only component for the
 * staff order page and the customer's account, so both always show the same record.
 */
export function OrderSummary({
  summary,
  className,
}: {
  summary: OrderSummaryData;
  className?: string;
}) {
  const payments = summary.payments.filter((payment) => !payment.voided_at);
  const completed = summary.status === 'released';
  const washName = summary.wash_type?.name ?? summary.wash_type_name ?? 'Regular washing';

  return (
    <Card className={cn('p-4 md:p-5', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-line-strong pb-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold">Order summary</h2>
          <p className="text-[13px] font-semibold">{summary.shop.name}</p>
          <p className="text-[13px] text-muted">{summary.shop.address}</p>
          {summary.shop.contact_number && (
            <p className="text-[13px] text-muted">{summary.shop.contact_number}</p>
          )}
        </div>
        <StatusChip status={summary.status} className="text-[13px]" />
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 py-3 text-sm sm:grid-cols-3">
        <Row label="Transaction ID">
          <Mono>{summary.order_number}</Mono>
        </Row>
        <Row label="Date received">{formatDateTime(summary.received_at)}</Row>
        <Row label={completed ? 'Status' : 'Estimated completion'}>
          {completed ? 'Completed' : formatRelativeDay(summary.promised_at)}
        </Row>
        <Row label="Customer">
          {summary.customer.full_name}
          <span className="block font-normal text-muted">
            {formatPhone(summary.customer.contact_number)}
          </span>
        </Row>
        <Row label="Wash type">{washName}</Row>
        <Row label={summary.baskets.length === 1 ? 'Basket' : 'Baskets'}>
          {summary.baskets.length > 0 ? (
            <Mono>{summary.baskets.map((b) => b.basket_number).join(', ')}</Mono>
          ) : (
            '—'
          )}
        </Row>
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Services for {summary.order_number}</caption>
          <thead>
            <tr className="border-y border-line text-left text-[13px] text-muted">
              <th scope="col" className="py-2 pr-2 font-semibold">
                Service
              </th>
              <th scope="col" className="px-2 py-2 font-semibold">
                Weight / qty
              </th>
              <th scope="col" className="px-2 py-2 font-semibold max-sm:hidden">
                Unit price
              </th>
              <th scope="col" className="py-2 pl-2 text-right font-semibold">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.items.map((item) => {
              const billed = item.subtotal_cents / item.unit_price_cents;
              const usedMinimum = item.pricing_type === 'per_kg' && billed > (item.weight_kg ?? 0);
              return (
                <tr key={item.id} className="border-b border-line">
                  <td className="py-2.5 pr-2 font-semibold">
                    {item.service_name}
                    <span className="block text-xs font-normal text-muted sm:hidden">
                      {formatMoney(item.unit_price_cents)}
                      {itemRateSuffix(item)}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    {itemQuantityLabel(item)}
                    {usedMinimum && (
                      <span className="block text-xs text-muted">billed as {formatKg(billed)}</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap max-sm:hidden">
                    {formatMoney(item.unit_price_cents)}
                    {itemRateSuffix(item)}
                  </td>
                  <td className="py-2.5 pl-2 text-right">
                    <Money cents={item.subtotal_cents} />
                  </td>
                </tr>
              );
            })}
            <tr className="border-b border-line" data-testid="wash-type-line">
              <td colSpan={3} className="py-2.5 pr-2 font-semibold max-sm:hidden">
                Wash type:{' '}
                {washBillLine(
                  washName,
                  summary.wash_surcharge_per_kg_cents,
                  Math.round(summary.per_kg_weight_kg * 10),
                  formatMoney,
                )}
              </td>
              <td className="py-2.5 pr-2 font-semibold sm:hidden">
                Wash type: {washName}
                <span className="block text-xs font-normal text-muted">
                  {washBillLine(
                    '',
                    summary.wash_surcharge_per_kg_cents,
                    Math.round(summary.per_kg_weight_kg * 10),
                    formatMoney,
                  ).replace(/^ — /, '')}
                </span>
              </td>
              <td className="py-2.5 pl-2 text-right">
                <Money cents={summary.wash_surcharge_cents} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <dl className="mt-3 ml-auto w-full max-w-64 space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted">Total</dt>
          <dd className="text-[17px] font-extrabold">
            <Money cents={summary.total_cents} />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Paid</dt>
          <dd>
            <Money cents={summary.paid_cents} />
          </dd>
        </div>
        <div
          className={cn(
            'flex justify-between font-bold',
            summary.balance_cents > 0 ? 'text-warn' : 'text-ok',
          )}
        >
          <dt>Balance due</dt>
          <dd>
            <Money cents={summary.balance_cents} />
          </dd>
        </div>
      </dl>

      <h3 className="mt-4 mb-1 text-[15px] font-bold">Payments</h3>
      {payments.length === 0 ? (
        <p className="text-sm text-muted">No payment yet. The balance is settled at pickup.</p>
      ) : (
        <ul className="divide-y divide-line text-sm">
          {payments.map((payment) => (
            <li key={payment.id} className="flex items-start justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="font-semibold">
                  {payment.method_label} · {formatDateTime(payment.paid_at)}
                </p>
                <p className="text-[13px] text-muted">
                  Ref. no. <Mono>{payment.receipt_number}</Mono>
                  {payment.reference_number && (
                    <>
                      {' '}
                      · {payment.method_label} <Mono>{payment.reference_number}</Mono>
                    </>
                  )}
                </p>
              </div>
              <Money cents={payment.amount_cents} className="shrink-0 font-semibold" />
            </li>
          ))}
        </ul>
      )}
      {summary.shop.receipt_footer && (
        <p className="mt-4 border-t border-dashed border-line-strong pt-3 text-center text-[13px] text-muted">
          {summary.shop.receipt_footer}
        </p>
      )}
    </Card>
  );
}
