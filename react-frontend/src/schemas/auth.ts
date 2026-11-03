import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username.'),
  password: z.string().min(1, 'Enter your password.'),
  remember: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
