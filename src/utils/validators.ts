import { z } from 'zod';
import { getTodayDateString } from './dateUtils';

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
  email: z
    .string()
    .trim()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Please enter a valid email address (e.g. you@example.com)' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(72, { message: 'Password cannot exceed 72 characters' }),
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Zod Schema for skill creation / editing
export const SkillFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Please enter a skill name.' })
    .max(60, { message: 'Skill name is too long (max 60 characters).' }),
  targetHours: z
    .number({ message: 'Please enter a valid target hours number.' })
    .positive({ message: 'Please enter a valid target hours number.' })
    .max(1000, { message: 'Target hours is too large (max 1000).' })
    .optional(),
});

// Zod Schema for logging / editing a practice session
export const SessionFormSchema = z
  .object({
    skillId: z.string().min(1, { message: 'Please select a skill.' }),
    durationMinutes: z
      .number({ message: 'Please enter a valid duration (e.g. 45, 1h 30m, or 1.5).' })
      .int({ message: 'Please enter a valid duration (e.g. 45, 1h 30m, or 1.5).' })
      .positive({ message: 'Please enter a valid duration (e.g. 45, 1h 30m, or 1.5).' })
      .max(1440, { message: 'Duration cannot exceed 24 hours.' }),
    date: z
      .string()
      .regex(DATE_RE, { message: 'Please choose a valid practice date.' }),
    notes: z
      .string()
      .trim()
      .max(2000, { message: 'Notes are too long (max 2000 characters).' })
      .nullable()
      .optional(),
  })
  .refine((data) => !data.date || data.date <= getTodayDateString(), {
    message: 'Practice date cannot be in the future.',
    path: ['date'],
  });

export type SkillFormInput = z.infer<typeof SkillFormSchema>;
export type SessionFormInput = z.infer<typeof SessionFormSchema>;
