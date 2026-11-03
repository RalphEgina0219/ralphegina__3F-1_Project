import { z } from 'zod';
import { parseMoney } from '@/lib/money';

export const serviceSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter the service name.'),
    description: z.string().trim(),
    pricing_type: z.enum(['per_kg', 'per_piece', 'flat']),
    rate: z.string().refine((value) => (parseMoney(value) ?? 0) > 0, 'Enter a rate above zero.'),
    minimum_qty: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.pricing_type === 'per_kg' && value.minimum_qty !== '') {
      const minimum = Number(value.minimum_qty);
      if (!Number.isFinite(minimum) || minimum < 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['minimum_qty'],
          message: 'Enter a number of kilos.',
        });
      }
    }
  });

export type ServiceForm = z.infer<typeof serviceSchema>;

export const userSchema = z.object({
  name: z.string().trim().min(2, 'Enter the full name.'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,}$/, 'Use at least 3 letters, numbers, dots or dashes.'),
  role: z.enum(['admin', 'staff']),
  password: z.string(),
});

export type UserForm = z.infer<typeof userSchema>;

export const shopSchema = z.object({
  name: z.string().trim().min(1, 'Enter the shop name.'),
  address: z.string().trim().min(1, 'Enter the address.'),
  contact_number: z.string().trim(),
  opening_hours: z.string().trim(),
  receipt_footer: z.string().trim(),
  claim_policy_days: z.string().regex(/^\d+$/, 'Enter a whole number of days.'),
});

export type ShopForm = z.infer<typeof shopSchema>;
