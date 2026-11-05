import { z } from 'zod';
import { parseMoney } from '@/lib/money';

const amountOrEmpty = z
  .string()
  .refine(
    (value) => value.trim() === '' || parseMoney(value) !== null,
    'Enter a peso amount, like 200.00.',
  );

export const newOrderSchema = z
  .object({
    customer_id: z.number({ error: 'Choose a customer.' }).int().positive('Choose a customer.'),
    basket_ids: z.array(z.number().int().positive()).min(1, 'Add at least one basket.'),
    items: z
      .array(
        z.object({
          service_id: z.string().min(1, 'Choose a service.'),
          amount: z.number().positive('Enter more than zero.'),
        }),
      )
      .min(1, 'Add at least one service.'),
    addons: z.array(z.number()),
    promised_at: z
      .string()
      .min(1, 'Choose the estimated completion date and time.')
      .refine(
        (value) => new Date(value).getTime() >= Date.now() - 60_000,
        'Estimated completion cannot be in the past.',
      ),
    notes: z.string().trim(),
    payment_method: z.enum(['cash', 'gcash', 'later']),
    amount: amountOrEmpty,
    reference: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    if (value.payment_method === 'later') return;
    if ((parseMoney(value.amount) ?? 0) <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['amount'],
        message: 'Enter the amount received, or choose Pay later.',
      });
    }
    if (value.payment_method === 'gcash' && !value.reference) {
      ctx.addIssue({
        code: 'custom',
        path: ['reference'],
        message: 'Enter the GCash reference number.',
      });
    }
  });

export type NewOrderForm = z.infer<typeof newOrderSchema>;

export const editOrderSchema = z.object({
  promised_at: z.string().min(1, 'Choose the estimated completion date and time.'),
  notes: z.string().trim(),
});

export type EditOrderForm = z.infer<typeof editOrderSchema>;
