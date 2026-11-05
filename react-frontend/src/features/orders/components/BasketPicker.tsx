import { QrCode, ShoppingBasket, X } from 'lucide-react';
import { lazy, Suspense, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { fetchScan, useAvailableBaskets } from '@/features/baskets/api';
import { errorMessage } from '@/lib/api';
import { parseScanInput } from '@/lib/basket';
import type { BasketRefDto } from '@/types/api';

// The scanner library is large: load it only when someone actually scans.
const CameraScanner = lazy(() =>
  import('@/features/qr/components/CameraScanner').then((module) => ({
    default: module.CameraScanner,
  })),
);

const NOT_A_BASKET = 'QR not recognized. Scan a LaundryFlow basket label.';

interface BasketPickerProps {
  value: readonly BasketRefDto[];
  onChange: (baskets: BasketRefDto[]) => void;
  error?: string;
  id?: string;
}

/** Step "Baskets" of a new order: at least one available basket, by scan, by number or by list. */
export function BasketPicker({ value, onChange, error, id }: BasketPickerProps) {
  const available = useAvailableBaskets();
  const [scanning, setScanning] = useState(false);
  const [typed, setTyped] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const lastScan = useRef<{ text: string; at: number } | null>(null);

  const chosen = new Set(value.map((b) => b.id));
  const options = (available.data ?? [])
    .filter((b) => !chosen.has(b.id))
    .map((b) => ({
      value: String(b.id),
      label: b.label ? `${b.basket_number} · ${b.label}` : b.basket_number,
    }));

  const add = (basket: BasketRefDto) => {
    setProblem(null);
    if (chosen.has(basket.id)) return;
    onChange([...value, { id: basket.id, basket_number: basket.basket_number }]);
  };

  /** Checks a scanned or typed code with the server, which has the final word on availability. */
  const resolve = async (text: string) => {
    const input = parseScanInput(text);
    if (!input) return setProblem(NOT_A_BASKET);
    if (input.kind === 'order_number') {
      return setProblem('That is an order number. Scan or type a basket number, like BSK-0007.');
    }
    setChecking(true);
    try {
      const result = await fetchScan(input.value);
      if (result.type !== 'basket') return setProblem(NOT_A_BASKET);
      const { basket, active_order } = result;
      if (basket.status === 'retired') {
        setProblem(`${basket.basket_number} is retired and cannot be used.`);
      } else if (active_order) {
        setProblem(`${basket.basket_number} is in use by ${active_order.order_number}.`);
      } else if (chosen.has(basket.id)) {
        setProblem(`${basket.basket_number} is already added.`);
      } else {
        add(basket);
        setScanning(false);
        setTyped('');
      }
    } catch (scanError) {
      setProblem(errorMessage(scanError));
    } finally {
      setChecking(false);
    }
  };

  const onDetected = (text: string) => {
    const now = Date.now();
    if (lastScan.current?.text === text && now - lastScan.current.at < 4000) return;
    lastScan.current = { text, at: now };
    void resolve(text);
  };

  const submitTyped = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    void resolve(typed);
  };

  const message = problem ?? error;

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <ul aria-label="Baskets for this order" className="flex flex-wrap gap-2">
          {value.map((basket) => (
            <li
              key={basket.id}
              className="flex min-h-11 items-center gap-1 rounded-control border border-flow-line bg-flow-soft pl-3 font-mono font-semibold"
            >
              <ShoppingBasket className="size-4 text-flow" aria-hidden="true" />
              {basket.basket_number}
              <button
                type="button"
                aria-label={`Remove ${basket.basket_number}`}
                className="flex size-11 items-center justify-center rounded-control text-muted hover:text-text"
                onClick={() => onChange(value.filter((b) => b.id !== basket.id))}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          Tag the laundry with at least one basket. Big loads can use several.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
        <Button
          variant="secondary"
          icon={<QrCode className="size-4" aria-hidden="true" />}
          onClick={() => {
            setProblem(null);
            setScanning(true);
          }}
        >
          Scan basket
        </Button>
        <Select
          id={id}
          aria-label="Add an available basket"
          value=""
          placeholder={
            available.isPending
              ? 'Loading baskets…'
              : options.length === 0
                ? 'No available baskets'
                : 'Choose an available basket'
          }
          disabled={options.length === 0}
          onValueChange={(next) => {
            const basket = available.data?.find((b) => String(b.id) === next);
            if (basket) add(basket);
          }}
          options={options}
          {...(message ? { 'aria-invalid': true as const } : {})}
        />
      </div>

      {message && (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {message}
        </p>
      )}

      <Dialog
        open={scanning}
        onOpenChange={setScanning}
        title="Scan basket label"
        description="Point the camera at the QR on the basket."
      >
        <Suspense fallback={<div className="aspect-square animate-pulse rounded-card bg-ink" />}>
          {scanning && <CameraScanner onDetected={onDetected} paused={checking} autoStart />}
        </Suspense>
        {/* A separate form: this dialog renders outside the order form, so Enter adds the basket. */}
        <form onSubmit={submitTyped} className="mt-3 flex gap-2">
          <label htmlFor="basket-number" className="sr-only">
            Basket number
          </label>
          <Input
            id="basket-number"
            className="font-mono"
            placeholder="BSK-0007"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
          <Button type="submit" className="shrink-0" loading={checking}>
            Add
          </Button>
        </form>
        {problem && (
          <p role="alert" className="mt-2 text-[13px] font-medium text-danger">
            {problem}
          </p>
        )}
      </Dialog>
    </div>
  );
}
