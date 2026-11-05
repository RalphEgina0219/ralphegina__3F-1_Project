import { z } from 'zod';
import { cleanName, passwordProblem } from '@/lib/accounts';
import { emailField, phoneField } from './customer';

/** The same password rule as the server: 8+ characters with a letter and a number. */
const passwordField = z.string().superRefine((value, ctx) => {
  const problem = passwordProblem(value);
  if (problem) ctx.addIssue({ code: 'custom', message: problem });
});

const confirmed = <T extends { password: string; password_confirmation: string }>(
  value: T,
  ctx: z.RefinementCtx,
) => {
  if (value.password_confirmation !== value.password) {
    ctx.addIssue({
      code: 'custom',
      path: ['password_confirmation'],
      message: 'The passwords do not match.',
    });
  }
};

export const registerSchema = z
  .object({
    full_name: z.string().refine((value) => cleanName(value).length >= 2, 'Enter your full name.'),
    contact_number: phoneField,
    email: emailField,
    password: passwordField,
    password_confirmation: z.string().min(1, 'Type the password again.'),
    barangay_id: z.string().min(1, 'Choose your barangay.'),
    street_address: z.string().trim(),
  })
  .superRefine(confirmed);

export type RegisterForm = z.infer<typeof registerSchema>;

export const customerLoginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email.'),
  password: z.string().min(1, 'Enter your password.'),
});

export type CustomerLoginForm = z.infer<typeof customerLoginSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password.'),
    password: passwordField,
    password_confirmation: z.string().min(1, 'Type the new password again.'),
  })
  .superRefine(confirmed);

export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export const accountSchema = z.object({
  contact_number: phoneField,
  barangay_id: z.string().min(1, 'Choose your barangay.'),
  street_address: z.string().trim(),
});

export type AccountForm = z.infer<typeof accountSchema>;
