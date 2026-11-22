import { QRCodeSVG } from 'qrcode.react';
import { createPortal } from 'react-dom';
import { basketUrl } from '@/lib/basket';
import { useBranding } from '@/features/branding/BrandingProvider';
import { cn } from '@/lib/cn';
import type { BasketDto } from '../types';

type LabelBasket = Pick<BasketDto, 'basket_number' | 'qr_token' | 'label'>;

const PER_PAGE = 24;

/**
 * One 64 × 34.5 mm basket label. The QR holds only the basket's permanent random token, so a
 * reprint is always identical and a lost label never exposes an order or a customer.
 */
export function BasketLabel({
  basket,
  shopName,
  className,
}: {
  basket: LabelBasket;
  shopName: string;
  className?: string;
}) {
  const branding = useBranding();
  return (
    <div
      className={cn(
        'basket-label flex items-center gap-[2.5mm] bg-white p-[2mm] text-ink',
        className,
      )}
      style={{ width: '64mm', height: '34.5mm' }}
    >
      <QRCodeSVG
        value={basketUrl(basket.qr_token)}
        size={104}
        level="M"
        marginSize={0}
        title={`QR code for basket ${basket.basket_number}`}
        style={{ width: '27mm', height: '27mm', flexShrink: 0 }}
      />
      <div className="min-w-0 leading-tight">
        {branding.basket_label_show_shop_name && (
          <p className="truncate font-bold" style={{ fontSize: '8pt' }}>
            {shopName}
          </p>
        )}
        <p className="font-mono font-extrabold" style={{ fontSize: '16pt', lineHeight: 1.15 }}>
          {basket.basket_number}
        </p>
        {basket.label && (
          <p className="truncate" style={{ fontSize: '7pt' }}>
            {basket.label}
          </p>
        )}
        {branding.basket_label_footer && (
          <p
            className="mt-[1mm] font-bold uppercase"
            style={{ fontSize: '7pt', letterSpacing: '0.04em' }}
          >
            {branding.basket_label_footer}
          </p>
        )}
      </div>
    </div>
  );
}

/** The print-only A4 sheet: 3 × 8 labels per page. Hidden on screen; printAs('labels') shows it. */
export function BasketLabelSheet({
  baskets,
  shopName,
}: {
  baskets: readonly LabelBasket[];
  shopName: string;
}) {
  const pages: LabelBasket[][] = [];
  for (let start = 0; start < baskets.length; start += PER_PAGE) {
    pages.push(baskets.slice(start, start + PER_PAGE));
  }
  return createPortal(
    <div className="print-only" aria-hidden="true">
      {pages.map((page, index) => (
        <div key={index} className="label-page">
          {page.map((basket) => (
            <BasketLabel key={basket.basket_number} basket={basket} shopName={shopName} />
          ))}
        </div>
      ))}
    </div>,
    document.body,
  );
}
