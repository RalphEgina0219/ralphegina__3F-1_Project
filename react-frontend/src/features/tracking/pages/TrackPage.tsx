import { Check, RotateCw } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mono } from '@/components/ui/Mono';
import { useDocumentTitle } from '@/components/ui/PageHeader';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { errorStatus } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatRelativeDay, formatSmartTime, formatTime } from '@/lib/dates';
import { STATUS_META, statusIndex } from '@/lib/status';
import type { PublicTrackingDto } from '@/types/api';
import { useTracking } from '../api';
import { PublicHeader } from '../components/PublicHeader';
import { TrackingLookupForm } from '../components/TrackingLookupForm';

function Timeline({ data }: { data: PublicTrackingDto }) {
  const current = statusIndex(data.status);
  return (
    <ol className="mt-4 space-y-3">
      {data.timeline.map((step, index) => {
        const isCurrent = index === current && data.status !== 'released';
        const done = index < current || data.status === 'released';
        return (
          <li
            key={step.status}
            aria-current={isCurrent ? 'step' : undefined}
            className="flex items-center gap-3"
          >
            {done ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-flow text-white">
                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
              </span>
            ) : isCurrent ? (
              <span
                className={cn(
                  'size-7 shrink-0 rounded-full ring-4 ring-flow-soft',
                  STATUS_META[step.status].dot,
                )}
              />
            ) : (
              <span className="size-7 shrink-0 rounded-full border-2 border-line-strong bg-surface" />
            )}
            <span
              className={cn(
                'min-w-0 flex-1',
                done && 'font-semibold',
                isCurrent && ['font-bold', STATUS_META[step.status].fg].join(' '),
                !done && !isCurrent && 'text-muted',
              )}
            >
              {step.label}
              {isCurrent && <span className="sr-only"> (current stage)</span>}
            </span>
            {step.at && (
              <span className="shrink-0 text-[13px] text-muted">{formatSmartTime(step.at)}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function TrackPage() {
  const token = useParams().token ?? '';
  const query = useTracking(token);
  useDocumentTitle('Order tracking');

  if (query.isPending) {
    return (
      <>
        <PublicHeader>
          <Skeleton className="mt-5 h-24 w-3/4 bg-ink-3" />
        </PublicHeader>
        <main className="mx-auto max-w-xl px-4 py-4" role="status" aria-label="Loading your order">
          <Skeleton className="h-96 rounded-card" />
        </main>
      </>
    );
  }

  if (query.isError) {
    const notFound = errorStatus(query.error) === 404;
    return (
      <>
        <PublicHeader>
          <h1 className="mt-5 text-[28px] leading-tight font-extrabold tracking-[-0.02em] text-on-ink">
            {notFound ? 'Order not found' : 'We could not load your order'}
          </h1>
          {notFound && (
            <p className="mt-1 text-sm text-on-ink-muted">
              This link may be incomplete. Enter the details from your receipt instead.
            </p>
          )}
        </PublicHeader>
        <main className="mx-auto max-w-xl px-4 py-5">
          <Card className={notFound ? 'p-5' : undefined}>
            {notFound ? (
              <TrackingLookupForm />
            ) : (
              <ErrorState error={query.error} onRetry={() => void query.refetch()} />
            )}
          </Card>
        </main>
      </>
    );
  }

  const data = query.data;
  const current = statusIndex(data.status);
  const isReleased = data.status === 'released';

  return (
    <>
      <PublicHeader overlap>
        <div className="mt-5" aria-live="polite">
          <h1 className="text-on-ink">
            <span className="block text-[15px] font-medium text-on-ink-muted">
              Hi {data.customer_display_name}, your laundry is
            </span>
            <span className="mt-0.5 block text-[32px] leading-tight font-extrabold tracking-[-0.02em]">
              {STATUS_META[data.status].sentence}
            </span>
          </h1>
          <Mono className="mt-1 block text-[13px] text-on-ink-muted">{data.order_number}</Mono>
        </div>
      </PublicHeader>

      <main className="mx-auto max-w-xl space-y-3 px-4 pb-8">
        <Card className="p-5">
          <p className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-[13px] font-medium text-muted">
              {isReleased ? 'Status' : 'Estimated ready'}
            </span>
            <span className="text-[17px] font-extrabold">
              {isReleased ? data.status_label : formatRelativeDay(data.estimated_ready_at)}
            </span>
          </p>
          <div
            role="progressbar"
            aria-label="Laundry progress"
            aria-valuemin={0}
            aria-valuemax={6}
            aria-valuenow={current + 1}
            aria-valuetext={`Stage ${current + 1} of 6: ${data.status_label}`}
            className="mt-3 grid grid-cols-6 gap-1.5"
          >
            {data.timeline.map((step, index) => (
              <span
                key={step.status}
                className={cn(
                  'h-2 rounded-full',
                  index < current || isReleased
                    ? 'bg-flow'
                    : index === current
                      ? STATUS_META[step.status].dot
                      : 'bg-foam-2',
                )}
              />
            ))}
          </div>
          <Timeline data={data} />
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-bold">When it&apos;s ready</h2>
          <p className="mt-1 text-[15px]">
            Bring your receipt to the shop. Any remaining balance is settled at the counter.
          </p>
          <p className="mt-2 text-[13px] text-muted">
            {data.shop.hours} · {data.shop.address}
          </p>
        </Card>

        <div className="pt-2 text-center">
          <p className="text-[13px] text-muted">
            This page shows status only. Personal and payment details stay private.
          </p>
          <Button
            variant="ghost"
            className="mt-1 text-flow"
            loading={query.isFetching}
            icon={<RotateCw className="size-4" aria-hidden="true" />}
            onClick={() => void query.refetch()}
          >
            Refresh status
          </Button>
          <p className="text-xs text-muted">
            Updated {formatTime(new Date(query.dataUpdatedAt))}. Refreshes every minute.
          </p>
        </div>
      </main>
    </>
  );
}
