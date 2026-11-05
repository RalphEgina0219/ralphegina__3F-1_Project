import { CircleAlert, Flashlight, FlashlightOff, QrCode, ShoppingBasket, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Mono } from '@/components/ui/Mono';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/States';
import { errorMessage } from '@/lib/api';
import { parseScanInput } from '@/lib/basket';
import { formatSmartTime } from '@/lib/dates';
import type { ScanResultDto } from '@/types/api';
import { useRecentScans, useScan } from '../api';
import { CameraScanner } from '../components/CameraScanner';
import { BasketAvailable, BasketRetired, ScanOrderPanel } from '../components/ScanResult';

const NOT_RECOGNIZED = 'QR not recognized. Scan a LaundryFlow basket label.';

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
        Basket or order number
      </label>
      <Input
        id={id}
        className="font-mono"
        placeholder="Basket or order no."
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <Button type="submit" loading={pending} className="shrink-0">
        Find
      </Button>
    </form>
  );
}

function Result({ result }: { result: ScanResultDto }) {
  const flat = 'max-md:border-0 max-md:p-0';
  if (result.type === 'order') return <ScanOrderPanel id={result.order.id} className={flat} />;
  const { basket, active_order } = result;
  if (basket.status === 'retired') return <BasketRetired basket={basket} />;
  if (!active_order) return <BasketAvailable basket={basket} className={flat} />;
  return <ScanOrderPanel id={active_order.id} basket={basket} className={flat} />;
}

export default function ScanPage() {
  const [params, setParams] = useSearchParams();
  const [manual, setManual] = useState('');
  const [result, setResult] = useState<ScanResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState({ supported: false, on: false, toggle: () => {} });
  const scan = useScan();
  const { scans, add } = useRecentScans();
  const lastScan = useRef<{ text: string; at: number } | null>(null);

  const resolve = useCallback(
    (text: string) => {
      const input = parseScanInput(text);
      if (!input) {
        setResult(null);
        setError(NOT_RECOGNIZED);
        return;
      }
      setError(null);
      scan.mutate(input.value, {
        onSuccess: (found) => {
          setResult(found);
          if (found.type === 'order') {
            add({
              code: found.order.order_number,
              kind: 'order',
              detail: found.order.customer.full_name,
              at: new Date().toISOString(),
            });
          } else {
            add({
              code: found.basket.basket_number,
              kind: 'basket',
              detail:
                found.basket.status === 'retired'
                  ? 'Retired'
                  : found.active_order
                    ? `${found.active_order.customer.full_name} · ${found.active_order.order_number}`
                    : 'Available',
              at: new Date().toISOString(),
            });
          }
        },
        onError: (lookupError) => {
          setResult(null);
          // The server words each case: unknown label, unknown basket number or order number.
          setError(errorMessage(lookupError));
        },
      });
    },
    [add, scan],
  );

  // Arriving from a basket label (/b/:token) or a recent scan: resolve once, then tidy the URL.
  const code = params.get('code');
  useEffect(() => {
    if (!code) return;
    resolve(code);
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

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
    pending: scan.isPending,
  };

  return (
    <div className="max-md:-mx-4 max-md:-mb-8 max-md:flex max-md:min-h-dvh max-md:flex-col max-md:bg-ink-deep">
      <div className="max-md:hidden">
        <PageHeader
          title="QR Tracking"
          subtitle="Scan a basket label to see its laundry and update the status."
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
        <h1 className="text-base font-bold text-on-ink">Scan basket</h1>
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
          <CameraScanner onDetected={onDetected} paused={scan.isPending} onTorchChange={setTorch} />
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
            Use the label on the basket
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
                  Not found
                </p>
                <p className="mt-1 text-sm text-muted">{error}</p>
              </Card>
            </div>
          )}

          {result && !error && <Result result={result} />}

          <Card className="p-4 md:p-5 max-md:border-0 max-md:p-0">
            <CardHeader title="Recent scans" className="mb-2" />
            {scans.length === 0 ? (
              <EmptyState
                icon={QrCode}
                title="No scans yet"
                description="Baskets and orders you scan on this device appear here."
                className="py-5"
              />
            ) : (
              <ul className="divide-y divide-line">
                {scans.map((recent) => (
                  <li key={recent.code}>
                    <button
                      type="button"
                      onClick={() => resolve(recent.code)}
                      className="flex min-h-11 w-full flex-wrap items-center gap-x-3 py-1.5 text-left hover:text-flow"
                    >
                      {recent.kind === 'basket' && (
                        <ShoppingBasket className="size-4 text-flow" aria-hidden="true" />
                      )}
                      <Mono className="text-[13px]">{recent.code}</Mono>
                      <span className="min-w-0 flex-1 truncate">{recent.detail}</span>
                      <span className="text-[13px] text-muted">{formatSmartTime(recent.at)}</span>
                    </button>
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
