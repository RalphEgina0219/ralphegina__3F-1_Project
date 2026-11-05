import { z } from 'zod';
import { cleanName, isValidEmail, normalizeEmail } from '@/lib/accounts';
import { isValidPhone, normalizePhone } from '@/lib/format';
import type { CustomerInput } from '@/types/api';

export const phoneField = z.string().trim().refine(isValidPhone, 'Use the format 09XX XXX XXXX.');

export const emailField = z
  .string()
  .trim()
  .min(1, 'Enter an email address.')
  .refine(isValidEmail, 'Enter a valid email address.');

const base = {
  // A name of only spaces is rejected.
  full_name: z.string().refine((value) => cleanName(value).length >= 2, 'Enter the full name.'),
  contact_number: phoneField,
  barangay_id: z.string().min(1, 'Choose a barangay.'),
  street_address: z.string().trim(),
  notes: z.string().trim(),
};

/** Editing a profile. The account's email is not changed here. */
export const customerSchema = z.object({ ...base, email: z.string() });

/** Counter registration: the account is created in the same step, so the email is required. */
export const newCustomerSchema = z.object({ ...base, email: emailField });

export type CustomerForm = z.infer<typeof customerSchema>;

export function toCustomerInput(form: CustomerForm): CustomerInput {
  return {
    full_name: cleanName(form.full_name),
    contact_number: normalizePhone(form.contact_number),
    barangay_id: Number(form.barangay_id),
    street_address: form.street_address || null,
    notes: form.notes || null,
    ...(form.email ? { email: normalizeEmail(form.email) } : {}),
  };
}

export const createAccountSchema = z.object({ email: emailField });
export type CreateAccountForm = z.infer<typeof createAccountSchema>;
