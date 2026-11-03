import { CircleAlert, Flashlight, FlashlightOff, QrCode, X } from 'lucide-react';
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Mono } from '@/components/ui/Mono';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { useOrder } from '@/features/orders/api';
import { errorMessage, errorStatus } from '@/lib/api';
import { formatSmartTime } from '@/lib/dates';
import { parseScannedCode } from '@/lib/tracking';
import { useLookupOrder, useRecentScans } from '../api';
import { CameraScanner } from '../components/CameraScanner';
import { ScanResult } from '../components/ScanResult';

function ManualLookup({
  value,
  onChange,
  onSubmit,
  pending,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  pending: boolean;
  id: string;
}) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <label htmlFor={id} className="sr-only">
        Order number
      </label>
      <Input
        id={id}
        className="font-mono"
        placeholder="LF-261031-0019"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <Button type="submit" loading={pending} className="shrink-0">
        Find order
      </Button>
    </form>
  );
}

function ResolvedOrder({ id, className }: { id: number; className?: string }) {
  // Read through the shared cache so that status moves show up straight away.
  const order = useOrder(id);
  return order.data ? <ScanResult order={order.data} className={className} /> : null;
}

export default function ScanPage() {
  const [manual, setManual] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState({ supported: false, on: false, toggle: () => {} });
  const lookup = useLookupOrder();
  const { scans, add } = useRecentScans();
  const lastScan = useRef<{ text: string; at: number } | null>(null);

  const resolve = useCallback(
    (text: string) => {
      const code = parseScannedCode(text);
      if (!code) {
        setOrderId(null);
        setError(
          'That is not a LaundryFlow QR code or order number. Order numbers look like LF-261031-0019.',
        );
        return;
      }
      setError(null);
      lookup.mutate(code, {
        onSuccess: (order) => {
          setOrderId(order.id);
          add({
            id: order.id,
            order_number: order.order_number,
            customer_name: order.customer.full_name,
            at: new Date().toISOString(),
          });
        },
        onError: (lookupError) => {
          setOrderId(null);
          setError(
            errorStatus(lookupError) === 404
              ? 'No order matches this code. Check the number, or ask the customer for the receipt.'
              : errorMessage(lookupError),
          );
        },
      });
    },
    [add, lookup],
  );

  // A camera reports the same code many times a second: act on it once every few seconds.
  const onDetected = useCallback(
    (text: string) => {
      const now = Date.now();
      if (lastScan.current?.text === text && now - lastScan.current.at < 4000) return;
      lastScan.current = { text, at: now };
      resolve(text);
    },
    [resolve],
  );

  const submitManual = (event: FormEvent) => {
    event.preventDefault();
    resolve(manual);
  };

  const manualProps = {
    value: manual,
    onChange: setManual,
    onSubmit: submitManual,
    pending: lookup.isPending,
  };

  return (
    <div className="max-md:-mx-4 max-md:-mb-8 max-md:flex max-md:min-h-dvh max-md:flex-col max-md:bg-ink-deep">
      <div className="max-md:hidden">
        <PageHeader
          title="QR Tracking"
          subtitle="Scan a receipt or laundry tag to open the order and update its status."
        />
      </div>

      <header className="on-dark flex items-center justify-between px-3 pt-3 text-on-ink md:hidden">
        <Link
          to="/"
          aria-label="Close scanner"
          className="flex size-11 items-center justify-center rounded-control bg-ink-3"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
        <h1 className="text-base font-bold text-on-ink">Scan order QR</h1>
        {torch.supported ? (
          <button
            type="button"
            aria-label={torch.on ? 'Turn torch off' : 'Turn torch on'}
            aria-pressed={torch.on}
            onClick={torch.toggle}
            className="flex size-11 items-center justify-center rounded-control bg-ink-3"
          >
            {torch.on ? (
              <FlashlightOff className="size-5" aria-hidden="true" />
            ) : (
              <Flashlight className="size-5" aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="size-11" />
        )}
      </header>

      <div className="grid gap-5 md:grid-cols-2 md:items-start max-md:flex max-md:flex-1 max-md:flex-col max-md:gap-3">
        <Card className="min-w-0 p-5 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-4">
          <CameraScanner
            onDetected={onDetected}
            paused={lookup.isPending}
            onTorchChange={setTorch}
          />
          {torch.supported && (
            <Button
              variant="secondary"
              className="mt-3 w-full max-md:hidden"
              aria-pressed={torch.on}
              icon={<Flashlight className="size-4" aria-hidden="true" />}
              onClick={torch.toggle}
            >
              {torch.on ? 'Turn torch off' : 'Turn torch on'}
            </Button>
          )}
          <div className="mt-4 max-md:hidden">
            <ManualLookup {...manualProps} id="manual-desktop" />
          </div>
          <p className="mt-2 text-center text-[15px] font-bold text-on-ink md:hidden">
            Align the QR inside the frame
          </p>
          <p className="text-center text-[13px] text-on-ink-muted md:hidden">
            Works with the receipt or the bag tag
          </p>
        </Card>

        <div className="min-w-0 space-y-4 max-md:mt-auto max-md:rounded-t-sheet max-md:bg-surface max-md:p-4 md:space-y-5">
          <div className="md:hidden">
            <ManualLookup {...manualProps} id="manual-phone" />
          </div>

          {error && (
            <div role="alert">
              <Card className="border-danger-bar p-4 md:p-5">
                <p className="flex items-center gap-2 font-bold text-danger">
                  <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
                  Order not found
                </p>
                <p className="mt-1 text-sm text-muted">{error}</p>
              </Card>
            </div>
          )}

          {orderId && !error && (
            <ResolvedOrder id={orderId} className="max-md:border-0 max-md:p-0" />
          )}

          <Card className="p-4 md:p-5 max-md:border-0 max-md:p-0">
            <CardHeader title="Recent scans" className="mb-2" />
            {scans.length === 0 ? (
              <EmptyState
                icon={QrCode}
                title="No scans yet"
                description="Orders you scan on this device appear here."
                className="py-5"
              />
            ) : (
              <ul className="divide-y divide-line">
                {scans.map((scan) => (
                  <li key={scan.id}>
                    <Link
                      to={`/orders/${scan.id}`}
                      className="flex min-h-11 flex-wrap items-center gap-x-3 py-1.5 hover:text-flow"
                    >
                      <Mono className="text-[13px]">{scan.order_number}</Mono>
                      <span className="min-w-0 flex-1 truncate">{scan.customer_name}</span>
                      <span className="text-[13px] text-muted">{formatSmartTime(scan.at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
