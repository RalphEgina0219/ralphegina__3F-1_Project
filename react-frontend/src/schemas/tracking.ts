import { z } from 'zod';

export const trackingLookupSchema = z.object({
  order_number: z
    .string()
    .trim()
    .regex(/^LF-\d{6}-\d{4}$/i, 'Enter the order number from your receipt, like LF-261031-0019.'),
  phone_last4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Enter the last 4 digits of your phone number.'),
});

export type TrackingLookupForm = z.infer<typeof trackingLookupSchema>;
