import { z } from 'zod';
import type { CustomerInput } from '@/types/api';

export const customerSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter the full name.'),
  contact_number: z
    .string()
    .trim()
    .refine(
      (value) => /^09\d{9}$/.test(value.replace(/[\s-]/g, '')),
      'Use the format 09XX XXX XXXX.',
    ),
  barangay_id: z.string().min(1, 'Choose a barangay.'),
  street_address: z.string().trim(),
  notes: z.string().trim(),
});

export type CustomerForm = z.infer<typeof customerSchema>;

export function toCustomerInput(form: CustomerForm): CustomerInput {
  return {
    full_name: form.full_name,
    contact_number: form.contact_number.replace(/[\s-]/g, ''),
    barangay_id: Number(form.barangay_id),
    street_address: form.street_address || null,
    notes: form.notes || null,
  };
}
