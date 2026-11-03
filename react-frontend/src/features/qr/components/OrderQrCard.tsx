import { QRCodeSVG } from 'qrcode.react';
import { Copy, Printer } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { maskToken } from '@/lib/format';
import { printAs } from '@/lib/print';
import { trackingUrl } from '@/lib/tracking';
import type { OrderDto } from '@/types/api';

export function OrderQrCard({
  order,
}: {
  order: Pick<OrderDto, 'qr_token' | 'order_number' | 'customer'>;
}) {
  const url = trackingUrl(order.qr_token);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Tracking link copied');
    } catch {
      toast.error('Could not copy the link on this browser');
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-[17px] font-bold">Order QR code</h2>
      <div className="mx-auto mt-3 w-fit rounded-card border border-line bg-white p-3">
        <QRCodeSVG
          value={url}
          size={176}
          level="M"
          fgColor="var(--color-ink)"
          bgColor="var(--color-white)"
          title={`QR code for order ${order.order_number}`}
        />
      </div>
      <p className="mt-3 text-center font-mono text-[13px] font-medium">
        track/{maskToken(order.qr_token)}
      </p>
      <p className="mt-1.5 text-center text-[13px] text-muted">
        The QR holds only a random token. It opens the public tracking page, with no phone, address
        or payment details.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          icon={<Printer className="size-4" aria-hidden="true" />}
          onClick={() => printAs('tag')}
        >
          Print tag
        </Button>
        <Button
          variant="secondary"
          icon={<Copy className="size-4" aria-hidden="true" />}
          onClick={() => void copy()}
        >
          Copy link
        </Button>
      </div>
      {createPortal(
        <div className="print-only text-center">
          <QRCodeSVG value={url} size={150} level="M" style={{ margin: '0 auto' }} />
          <p className="mt-1 font-mono text-[11px] font-semibold">{order.order_number}</p>
        </div>,
        document.body,
      )}
    </Card>
  );
}
