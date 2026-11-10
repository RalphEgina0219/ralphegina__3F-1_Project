/**
 * Where a 422 from POST /orders belongs on the new-order form. The request's `items` are the
 * form's service rows followed by its add-ons, and its `payment` object is three flat fields.
 */
export function newOrderField(field: string, rowCount: number): string | null {
  const item = field.match(/^items\.(\d+)\.(\w+)$/);
  if (item) {
    const index = Number(item[1]);
    // An add-on (express, ironing…) has no row of its own: its message goes under the list.
    if (index >= rowCount) return 'items';
    return `items.${index}.${item[2] === 'service_id' ? 'service_id' : 'amount'}`;
  }
  if (field === 'payment' || field.startsWith('payment.')) {
    const part = field.slice('payment.'.length);
    if (part === 'reference_number') return 'reference';
    // The method and the amount share one message line, under the amount.
    return 'amount';
  }
  if (['customer_id', 'basket_ids', 'items', 'promised_at', 'notes'].includes(field)) return field;
  return null;
}

/** The wizard step (phones) that shows a field: 1 customer, 2 baskets, 3 services, 4 the rest. */
export function stepOfField(name: string): number {
  if (name === 'customer_id') return 1;
  if (name === 'basket_ids') return 2;
  if (name === 'items' || name.startsWith('items.')) return 3;
  return 4;
}
