import { z } from 'zod';

// Zod Schema for User Registration with 4-Digit PIN
export const RegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username cannot exceed 20 characters' })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'Username can only contain letters, numbers, hyphens, and underscores',
    }),
  name: z
    .string()
    .trim()
    .max(40, { message: 'Name is too long' })
    .optional(),
  pin: z
    .string()
    .regex(/^\d{4}$/, { message: 'PIN must be exactly 4 digits (e.g., 1234)' }),
});

// Zod Schema for Login
export const LoginSchema = z.object({
  username: z.string().trim().min(1, { message: 'Please enter your username' }),
  pin: z
    .string()
    .regex(/^\d{4}$/, { message: 'PIN must be exactly 4 digits' }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
