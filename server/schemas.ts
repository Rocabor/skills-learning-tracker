import { z } from 'zod';

// ----------------------------------------------------
// ZOD VALIDATION SCHEMAS (Server side)
// ----------------------------------------------------

const serverToday = () => new Date().toISOString().slice(0, 10);

const notInFuture = (d: { date?: string | undefined }) =>
  !d.date || d.date <= serverToday();

export const ServerRegisterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  name: z.string().trim().optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password cannot exceed 72 characters'),
});

export const ServerLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password cannot exceed 72 characters'),
});

export const ServerForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export const ServerResetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  code: z.string().regex(/^\d{6}$/, 'Reset code must be 6 digits'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(72, 'New password cannot exceed 72 characters'),
});

export const ServerSkillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  goal: z
    .object({
      type: z.enum(['total', 'weekly']),
      targetHours: z.number().positive(),
    })
    .nullable()
    .optional(),
});

export const ServerSkillUpdateSchema = ServerSkillSchema.partial();

export const ServerSessionBaseSchema = z.object({
  skillId: z.string().min(1, 'Skill is required'),
  durationMinutes: z.number().int().positive().max(1440),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  notes: z.string().nullable().optional(),
});

export const ServerSessionSchema = ServerSessionBaseSchema.refine(notInFuture, {
  message: 'Date cannot be in the future',
  path: ['date'],
});

export const ServerSessionUpdateSchema = ServerSessionBaseSchema.partial().refine(notInFuture, {
  message: 'Date cannot be in the future',
  path: ['date'],
});

export const ServerSyncSkillSchema = ServerSkillSchema.extend({
  id: z.string().min(1).optional(),
  createdAt: z.string().optional(),
});

export const ServerSyncSessionSchema = ServerSessionBaseSchema.extend({
  id: z.string().min(1).optional(),
  createdAt: z.string().optional(),
}).refine(notInFuture, {
  message: 'Date cannot be in the future',
  path: ['date'],
});

export const ServerBatchSyncSchema = z.object({
  skills: z.array(ServerSyncSkillSchema).max(200).optional(),
  sessions: z.array(ServerSyncSessionSchema).max(2000).optional(),
});
