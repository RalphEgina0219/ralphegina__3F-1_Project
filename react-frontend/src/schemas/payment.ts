import { z } from 'zod';
import { formatMoney, parseMoney } from '@/lib/money';

/** The balance is only known at runtime, so the rule that caps the amount is built per order. */
export function paymentSchema(balanceCents: number) {
  return z
    .object({
      amount: z.string(),
      method: z.enum(['cash', 'gcash']),
      reference: z.string().trim(),
    })
    .superRefine((value, ctx) => {
      const cents = parseMoney(value.amount);
      if (cents === null || cents <= 0) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Enter an amount above zero.' });
      } else if (cents > balanceCents) {
        ctx.addIssue({
          code: 'custom',
          path: ['amount'],
          message: `The amount cannot be more than the ${formatMoney(balanceCents)} balance.`,
        });
      }
      if (value.method === 'gcash' && !value.reference) {
        ctx.addIssue({
          code: 'custom',
          path: ['reference'],
          message: 'Enter the GCash reference number.',
        });
      }
    });
}

export interface PaymentForm {
  amount: string;
  method: 'cash' | 'gcash';
  reference: string;
}
