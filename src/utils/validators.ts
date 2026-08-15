import { z } from 'zod';

// Zod Schema for User Registration with email + password
export const RegisterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address (e.g. you@example.com)' }),
  name: z
    .string()
    .trim()
    .max(40, { message: 'Name is too long' })
    .optional(),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(72, { message: 'Password cannot exceed 72 characters' }),
});

// Zod Schema for Login
export const LoginSchema = z.object({
  email: z.string().trim().min(1, { message: 'Please enter your email' }),
  password: z.string().min(1, { message: 'Please enter your password' }),
});

// Zod Schema for requesting a password reset
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
});

// Zod Schema for completing a password reset
export const ResetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  code: z.string().regex(/^\d{6}$/, { message: 'Reset code must be 6 digits' }),
  newPassword: z
    .string()
    .min(6, { message: 'New password must be at least 6 characters' })
    .max(72, { message: 'New password cannot exceed 72 characters' }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
